use crate::ipc::{
    IpcCommand, TorrentAddedPayload, TorrentCompletedPayload, TorrentProgressPayload,
};
use crate::logger;
use librqbit::{
    api::TorrentIdOrHash, AddTorrent, AddTorrentOptions, AddTorrentResponse, ManagedTorrent,
    Session, SessionOptions,
};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tao::event_loop::EventLoopProxy;
use tokio::sync::RwLock;

struct TorrentMetrics {
    last_down_bytes: u64,
    last_up_bytes: u64,
    last_tick: Instant,
    down_speed: u64,
    up_speed: u64,
}

pub struct TorrentManager {
    session: Arc<Session>,
    download_dir: PathBuf,
    proxy: EventLoopProxy<IpcCommand>,
    metrics: Arc<RwLock<HashMap<String, TorrentMetrics>>>,
    completed: Arc<RwLock<HashSet<String>>>,
    shutdown: Arc<AtomicBool>,
}

impl TorrentManager {
    pub async fn new(
        download_dir: PathBuf,
        proxy: EventLoopProxy<IpcCommand>,
    ) -> anyhow::Result<Arc<Self>> {
        logger::info(&format!(
            "ᛗ Initializing Naglfar Swarm Torrent Engine in {}",
            download_dir.display()
        ));

        let opts = SessionOptions::default();

        let session = Session::new_with_opts(download_dir.clone(), opts).await?;

        let mgr = Arc::new(Self {
            session: session.clone(),
            download_dir: download_dir.clone(),
            proxy: proxy.clone(),
            metrics: Arc::new(RwLock::new(HashMap::new())),
            completed: Arc::new(RwLock::new(HashSet::new())),
            shutdown: Arc::new(AtomicBool::new(false)),
        });

        // Background Swarm Telemetry Ticker
        let ticker_session = session.clone();
        let ticker_proxy = proxy.clone();
        let ticker_metrics = mgr.metrics.clone();
        let ticker_completed = mgr.completed.clone();
        let ticker_shutdown = mgr.shutdown.clone();
        let ticker_dir = download_dir.clone();

        tokio::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_millis(400)).await;
                if ticker_shutdown.load(Ordering::Relaxed) {
                    break;
                }

                let snapshots = ticker_session.with_torrents(|torrents| {
                    let mut list = Vec::new();
                    for (_id, handle) in torrents {
                        let info_hash = handle.info_hash().as_string();
                        let name = handle
                            .name()
                            .unwrap_or_else(|| "Resolving Swarm Metadata...".to_string());
                        let stats = handle.stats();
                        let progress_bytes = stats.progress_bytes;
                        let total_bytes = stats.total_bytes;
                        let finished = stats.finished || (total_bytes > 0 && progress_bytes >= total_bytes);

                        let mut live_peers = 0usize;
                        let mut uploaded_bytes = 0u64;

                        if let Some(live) = stats.live.as_ref() {
                            live_peers = live.snapshot.peer_stats.live as usize;
                            uploaded_bytes = live.snapshot.uploaded_bytes;
                        }

                        let raw_state = format!("{:?}", stats.state);
                        let state = if finished {
                            "seeding".to_string()
                        } else if raw_state.contains("Paused") {
                            "paused".to_string()
                        } else if raw_state.contains("Error") {
                            "error".to_string()
                        } else if total_bytes == 0 {
                            "metadata".to_string()
                        } else {
                            "downloading".to_string()
                        };

                        list.push((
                            info_hash,
                            name,
                            progress_bytes,
                            total_bytes,
                            uploaded_bytes,
                            live_peers,
                            state,
                            finished,
                        ));
                    }
                    list
                });

                let mut metrics_guard = ticker_metrics.write().await;
                let now = Instant::now();

                for (info_hash, name, down_bytes, total_bytes, up_bytes, peers, state, finished) in
                    snapshots
                {
                    let m = metrics_guard.entry(info_hash.clone()).or_insert_with(|| {
                        TorrentMetrics {
                            last_down_bytes: down_bytes,
                            last_up_bytes: up_bytes,
                            last_tick: now,
                            down_speed: 0,
                            up_speed: 0,
                        }
                    });

                    let elapsed = m.last_tick.elapsed().as_secs_f64();
                    if elapsed >= 0.35 {
                        m.down_speed = ((down_bytes.saturating_sub(m.last_down_bytes)) as f64
                            / elapsed) as u64;
                        m.up_speed =
                            ((up_bytes.saturating_sub(m.last_up_bytes)) as f64 / elapsed) as u64;
                        m.last_down_bytes = down_bytes;
                        m.last_up_bytes = up_bytes;
                        m.last_tick = now;
                    }

                    let remaining = total_bytes.saturating_sub(down_bytes);
                    let eta_seconds = if m.down_speed > 0 {
                        remaining / m.down_speed
                    } else {
                        0
                    };

                    let progress = if total_bytes > 0 {
                        ((down_bytes as f64 / total_bytes as f64) * 100.0).min(100.0)
                    } else {
                        0.0
                    };

                    let _ = ticker_proxy.send_event(IpcCommand::TorrentProgress {
                        payload: TorrentProgressPayload {
                            id: info_hash.clone(),
                            info_hash: info_hash.clone(),
                            name: name.clone(),
                            progress,
                            download_speed: m.down_speed,
                            upload_speed: m.up_speed,
                            total_bytes,
                            downloaded_bytes: down_bytes,
                            uploaded_bytes: up_bytes,
                            peers,
                            state,
                            eta_seconds,
                        },
                    });

                    if finished {
                        let mut comp_guard = ticker_completed.write().await;
                        if comp_guard.insert(info_hash.clone()) {
                            logger::info(&format!(
                                "ᛗ Naglfar Torrent Swarm acquisition complete: {}",
                                name
                            ));
                            let final_path = ticker_dir.join(&name).to_string_lossy().to_string();
                            let _ = ticker_proxy.send_event(IpcCommand::TorrentCompleted {
                                payload: TorrentCompletedPayload {
                                    id: info_hash.clone(),
                                    info_hash,
                                    name,
                                    total_bytes,
                                    path: final_path,
                                },
                            });
                        }
                    }
                }
            }
        });

        Ok(mgr)
    }

    pub async fn add_torrent(
        &self,
        input: &str,
        custom_dir: Option<String>,
    ) -> anyhow::Result<String> {
        let input = input.trim();
        logger::info(&format!("ᛗ Ingesting artifact into Naglfar Swarm: {}", input));

        let add = if input.starts_with("magnet:") {
            AddTorrent::from_url(input)
        } else if input.starts_with("http://") || input.starts_with("https://") {
            let client = reqwest::Client::builder()
                .timeout(Duration::from_secs(30))
                .build()?;
            let bytes = client.get(input).send().await?.bytes().await?;
            AddTorrent::from_bytes(bytes)
        } else {
            let path = PathBuf::from(input);
            let bytes = tokio::fs::read(&path).await?;
            AddTorrent::from_bytes(bytes)
        };

        let mut opts = AddTorrentOptions::default();
        let target_dir = custom_dir.unwrap_or_else(|| self.download_dir.to_string_lossy().to_string());
        opts.output_folder = Some(target_dir);

        let res = self.session.add_torrent(add, Some(opts)).await?;
        let (info_hash, name) = match res {
            AddTorrentResponse::Added(_id, handle) => {
                let h_str = handle.info_hash().as_string();
                let n_str = handle
                    .name()
                    .unwrap_or_else(|| "Resolving Swarm Metadata...".to_string());
                (h_str, n_str)
            }
            AddTorrentResponse::AlreadyManaged(_id, handle) => {
                let h_str = handle.info_hash().as_string();
                let n_str = handle
                    .name()
                    .unwrap_or_else(|| "Resolving Swarm Metadata...".to_string());
                (h_str, n_str)
            }
            _ => {
                return Err(anyhow::anyhow!("Unsupported torrent response from session"));
            }
        };

        let _ = self.proxy.send_event(IpcCommand::TorrentAdded {
            payload: TorrentAddedPayload {
                id: info_hash.clone(),
                info_hash: info_hash.clone(),
                name,
            },
        });

        Ok(info_hash)
    }

    fn find_handle(&self, id_or_hash: &str) -> Option<(usize, Arc<ManagedTorrent>)> {
        self.session.with_torrents(|torrents| {
            for (id, handle) in torrents {
                let h_str = handle.info_hash().as_string();
                if h_str.eq_ignore_ascii_case(id_or_hash) || id.to_string() == id_or_hash {
                    return Some((id, handle.clone()));
                }
            }
            None
        })
    }

    pub async fn pause_torrent(&self, id_or_hash: &str) -> anyhow::Result<()> {
        if let Some((_id, handle)) = self.find_handle(id_or_hash) {
            logger::info(&format!("ᛗ Pausing Naglfar torrent swarm {}", id_or_hash));
            self.session.pause(&handle).await?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Torrent not found in active session"))
        }
    }

    pub async fn resume_torrent(&self, id_or_hash: &str) -> anyhow::Result<()> {
        if let Some((_id, handle)) = self.find_handle(id_or_hash) {
            logger::info(&format!("ᛗ Resuming Naglfar torrent swarm {}", id_or_hash));
            self.session.unpause(&handle).await?;
            Ok(())
        } else {
            Err(anyhow::anyhow!("Torrent not found in active session"))
        }
    }

    pub async fn delete_torrent(&self, id_or_hash: &str, delete_files: bool) -> anyhow::Result<()> {
        if let Some((id, _handle)) = self.find_handle(id_or_hash) {
            logger::info(&format!(
                "ᛗ Exiling Naglfar torrent swarm {} (delete_files={})",
                id_or_hash, delete_files
            ));
            self.session
                .delete(TorrentIdOrHash::Id(id), delete_files)
                .await?;
            let mut m_guard = self.metrics.write().await;
            m_guard.remove(id_or_hash);
            let mut c_guard = self.completed.write().await;
            c_guard.remove(id_or_hash);
            Ok(())
        } else {
            Err(anyhow::anyhow!("Torrent not found in active session"))
        }
    }
}
