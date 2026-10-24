use crate::ipc::{DownloadCompletedPayload, DownloadProgressPayload, IpcCommand};
use crate::logger;
use futures::future::join_all;
use futures::StreamExt;
use reqwest::header::{ACCEPT_RANGES, CONTENT_DISPOSITION, CONTENT_LENGTH, RANGE};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tao::event_loop::EventLoopProxy;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;

pub struct DownloadManager {
    cancels: std::sync::RwLock<std::collections::HashMap<String, Arc<AtomicBool>>>,
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            cancels: std::sync::RwLock::new(std::collections::HashMap::new()),
        }
    }

    pub fn register_cancel(&self, id: &str) -> Arc<AtomicBool> {
        let flag = Arc::new(AtomicBool::new(false));
        if let Ok(mut map) = self.cancels.write() {
            map.insert(id.to_string(), flag.clone());
        }
        flag
    }

    pub fn cancel(&self, id: &str) {
        if let Ok(map) = self.cancels.read() {
            if let Some(flag) = map.get(id) {
                flag.store(true, Ordering::SeqCst);
                logger::info(&format!("ᛗ Dispatched cancellation signal to conduit {}", id));
            }
        }
    }

    pub fn cleanup(&self, id: &str) {
        if let Ok(mut map) = self.cancels.write() {
            map.remove(id);
        }
    }
}

fn extract_filename_from_headers(headers: &reqwest::header::HeaderMap) -> Option<String> {
    if let Some(cd) = headers.get(CONTENT_DISPOSITION) {
        if let Ok(cd_str) = cd.to_str() {
            if let Some(idx) = cd_str.find("filename*=") {
                let rest = &cd_str[idx + 10..];
                let val = rest.split(';').next().unwrap_or("").trim().trim_matches('"');
                if let Some(utf8_idx) = val.find("''") {
                    let decoded = val[utf8_idx + 2..].to_string();
                    if !decoded.is_empty() {
                        return Some(decoded);
                    }
                }
            }
            if let Some(idx) = cd_str.find("filename=") {
                let rest = &cd_str[idx + 9..];
                let val = rest.split(';').next().unwrap_or("").trim().trim_matches('"');
                if !val.is_empty() {
                    return Some(val.to_string());
                }
            }
        }
    }
    None
}

pub async fn start_accelerated_download(
    id: String,
    url: String,
    dest_path: PathBuf,
    proxy: EventLoopProxy<IpcCommand>,
    cancel_flag: Arc<AtomicBool>,
) {
    logger::info(&format!(
        "ᛗ Bifröst Accelerator initiating acquisition for {} -> {}",
        url,
        dest_path.display()
    ));

    let client = match reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Mimir/0.5.0")
        .timeout(Duration::from_secs(45))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            logger::error(&format!("Failed to build HTTP client: {}", e));
            let _ = proxy.send_event(IpcCommand::DownloadCompleted {
                payload: DownloadCompletedPayload {
                    id: Some(id),
                    url,
                    path: dest_path.to_string_lossy().to_string(),
                    success: false,
                    size: "0 B".to_string(),
                },
            });
            return;
        }
    };

    // 1. Probe URL with HEAD request to determine file size, range support, and content disposition
    let head_probe = client.head(&url).send().await;
    let (total_size_opt, accept_ranges, server_filename) = match head_probe {
        Ok(res) => {
            let len = res
                .headers()
                .get(CONTENT_LENGTH)
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.parse::<u64>().ok());
            let ranges = res
                .headers()
                .get(ACCEPT_RANGES)
                .and_then(|v| v.to_str().ok())
                .map(|v| v.to_lowercase().contains("bytes"))
                .unwrap_or(false);
            let s_name = extract_filename_from_headers(res.headers());
            (len, ranges, s_name)
        }
        Err(_) => (None, false, None),
    };

    let mut final_dest_path = dest_path;
    if let Some(s_name) = server_filename {
        if let Some(parent) = final_dest_path.parent() {
            final_dest_path = parent.join(s_name);
        }
    }

    // If server supports ranges and file is > 2 MB, multiplex download strands
    if accept_ranges && total_size_opt.is_some() && total_size_opt.unwrap() >= 2 * 1024 * 1024 {
        let total_size = total_size_opt.unwrap();
        let strands_count = if total_size >= 100 * 1024 * 1024 {
            8
        } else if total_size >= 10 * 1024 * 1024 {
            4
        } else {
            2
        };

        logger::info(&format!(
            "ᛗ Multi-Strand Acceleration engaged: {} strands across {} bytes for {}",
            strands_count, total_size, url
        ));

        let chunk_size = total_size / (strands_count as u64);
        let downloaded_bytes = Arc::new(AtomicU64::new(0));
        let strand_bytes: Arc<Vec<AtomicU64>> = Arc::new(
            (0..strands_count).map(|_| AtomicU64::new(0)).collect()
        );
        let strand_totals: Arc<Vec<u64>> = Arc::new(
            (0..strands_count)
                .map(|i| {
                    if i == strands_count - 1 {
                        total_size - (i as u64 * chunk_size)
                    } else {
                        chunk_size
                    }
                })
                .collect()
        );

        // Background progress ticker
        let ticker_proxy = proxy.clone();
        let ticker_id = id.clone();
        let ticker_total = total_size;
        let ticker_downloaded = downloaded_bytes.clone();
        let ticker_strands = strand_bytes.clone();
        let ticker_totals = strand_totals.clone();
        let ticker_cancel = cancel_flag.clone();
        let ticker_count = strands_count;

        let ticker_handle = tokio::spawn(async move {
            let mut last_bytes = 0u64;
            let mut last_time = Instant::now();

            loop {
                tokio::time::sleep(Duration::from_millis(300)).await;
                if ticker_cancel.load(Ordering::Relaxed) {
                    break;
                }

                let current_bytes = ticker_downloaded.load(Ordering::Relaxed);
                let elapsed = last_time.elapsed().as_secs_f64();
                let speed_bps = if elapsed > 0.0 {
                    ((current_bytes.saturating_sub(last_bytes)) as f64 / elapsed) as u64
                } else {
                    0
                };
                last_bytes = current_bytes;
                last_time = Instant::now();

                let strand_progress: Vec<f32> = (0..ticker_count)
                    .map(|i| {
                        let got = ticker_strands[i].load(Ordering::Relaxed);
                        let tot = ticker_totals[i];
                        if tot > 0 {
                            (got as f32 / tot as f32).min(1.0)
                        } else {
                            0.0
                        }
                    })
                    .collect();

                let _ = ticker_proxy.send_event(IpcCommand::DownloadProgress {
                    payload: DownloadProgressPayload {
                        id: ticker_id.clone(),
                        received_bytes: current_bytes,
                        total_bytes: ticker_total,
                        speed_bytes_sec: speed_bps,
                        strands: ticker_count,
                        strand_progress,
                    },
                });

                if current_bytes >= ticker_total {
                    break;
                }
            }
        });

        // Spawn strand workers into isolated part files
        let mut workers = Vec::new();
        for i in 0..strands_count {
            let start = i as u64 * chunk_size;
            let end = if i == strands_count - 1 {
                total_size - 1
            } else {
                ((i + 1) as u64 * chunk_size) - 1
            };

            let strand_client = client.clone();
            let strand_url = url.clone();
            let strand_part_path = PathBuf::from(format!("{}.strand_{}", final_dest_path.display(), i));
            let strand_downloaded = downloaded_bytes.clone();
            let strand_counter = strand_bytes.clone();
            let strand_cancel = cancel_flag.clone();

            workers.push(tokio::spawn(async move {
                if strand_cancel.load(Ordering::Relaxed) {
                    return false;
                }

                let range_header = format!("bytes={}-{}", start, end);
                let response = match strand_client
                    .get(&strand_url)
                    .header(RANGE, range_header)
                    .send()
                    .await
                {
                    Ok(r) if r.status() == reqwest::StatusCode::PARTIAL_CONTENT => r,
                    _ => return false,
                };

                let mut part_file = match File::create(&strand_part_path).await {
                    Ok(f) => f,
                    Err(_) => return false,
                };

                let mut stream = response.bytes_stream();
                while let Some(item) = stream.next().await {
                    if strand_cancel.load(Ordering::Relaxed) {
                        drop(part_file);
                        let _ = tokio::fs::remove_file(&strand_part_path).await;
                        return false;
                    }
                    if let Ok(chunk) = item {
                        if part_file.write_all(&chunk).await.is_err() {
                            return false;
                        }
                        strand_downloaded.fetch_add(chunk.len() as u64, Ordering::Relaxed);
                        strand_counter[i].fetch_add(chunk.len() as u64, Ordering::Relaxed);
                    } else {
                        return false;
                    }
                }
                let _ = part_file.flush().await;
                true
            }));
        }

        let results = join_all(workers).await;
        ticker_handle.abort();

        let all_success = results.into_iter().all(|r| r.unwrap_or(false)) && !cancel_flag.load(Ordering::Relaxed);

        if all_success {
            // Assemble parts into final destination artifact
            let mut assembled = false;
            if let Ok(mut dest_file) = File::create(&final_dest_path).await {
                let mut concat_ok = true;
                for i in 0..strands_count {
                    let part_path = PathBuf::from(format!("{}.strand_{}", final_dest_path.display(), i));
                    if let Ok(mut part_file) = File::open(&part_path).await {
                        if tokio::io::copy(&mut part_file, &mut dest_file).await.is_err() {
                            concat_ok = false;
                        }
                        drop(part_file);
                        let _ = tokio::fs::remove_file(&part_path).await;
                    } else {
                        concat_ok = false;
                    }
                }
                let _ = dest_file.flush().await;
                assembled = concat_ok;
            }

            if assembled && final_dest_path.exists() {
                let final_size = std::fs::metadata(&final_dest_path)
                    .map(|m| crate::tab_manager::format_bytes(m.len()))
                    .unwrap_or_else(|_| "Unknown size".into());

                logger::info(&format!(
                    "ᛗ Multi-strand download successfully crystallized: {} ({})",
                    final_dest_path.display(),
                    final_size
                ));

                let _ = proxy.send_event(IpcCommand::DownloadCompleted {
                    payload: DownloadCompletedPayload {
                        id: Some(id),
                        url,
                        path: final_dest_path.to_string_lossy().to_string(),
                        success: true,
                        size: final_size,
                    },
                });
                return;
            }
        }

        // Clean up any remaining strand parts if aborted or failed
        for i in 0..strands_count {
            let part_path = PathBuf::from(format!("{}.strand_{}", final_dest_path.display(), i));
            let _ = tokio::fs::remove_file(&part_path).await;
        }

        if cancel_flag.load(Ordering::Relaxed) {
            let _ = tokio::fs::remove_file(&final_dest_path).await;
            logger::info("ᛗ Multi-strand acquisition cancelled by user");
            let _ = proxy.send_event(IpcCommand::DownloadCompleted {
                payload: DownloadCompletedPayload {
                    id: Some(id),
                    url,
                    path: final_dest_path.to_string_lossy().to_string(),
                    success: false,
                    size: "0 B".to_string(),
                },
            });
            return;
        }

        logger::warn("ᛗ Multi-strand transfer interrupted, seamlessly engaging single-strand conduit");
    }

    // 2. Fallback: Streaming single-strand download with progress telemetry
    logger::info(&format!(
        "ᛗ Channeling single-strand streaming conduit for {}",
        url
    ));

    let response = match client.get(&url).send().await {
        Ok(r) if r.status().is_success() => r,
        _ => {
            let _ = proxy.send_event(IpcCommand::DownloadCompleted {
                payload: DownloadCompletedPayload {
                    id: Some(id),
                    url,
                    path: final_dest_path.to_string_lossy().to_string(),
                    success: false,
                    size: "0 B".to_string(),
                },
            });
            return;
        }
    };

    let total_bytes = response.content_length().unwrap_or(0);
    let mut file = match File::create(&final_dest_path).await {
        Ok(f) => f,
        Err(_) => {
            let _ = proxy.send_event(IpcCommand::DownloadCompleted {
                payload: DownloadCompletedPayload {
                    id: Some(id),
                    url,
                    path: final_dest_path.to_string_lossy().to_string(),
                    success: false,
                    size: "0 B".to_string(),
                },
            });
            return;
        }
    };

    let mut stream = response.bytes_stream();
    let mut received = 0u64;
    let mut last_tick = Instant::now();
    let mut last_bytes = 0u64;

    while let Some(item) = stream.next().await {
        if cancel_flag.load(Ordering::Relaxed) {
            drop(file);
            let _ = tokio::fs::remove_file(&final_dest_path).await;
            let _ = proxy.send_event(IpcCommand::DownloadCompleted {
                payload: DownloadCompletedPayload {
                    id: Some(id),
                    url,
                    path: final_dest_path.to_string_lossy().to_string(),
                    success: false,
                    size: "0 B".to_string(),
                },
            });
            return;
        }

        if let Ok(chunk) = item {
            if file.write_all(&chunk).await.is_err() {
                break;
            }
            received += chunk.len() as u64;

            if last_tick.elapsed() >= Duration::from_millis(300) {
                let speed_bps = ((received.saturating_sub(last_bytes)) as f64
                    / last_tick.elapsed().as_secs_f64()) as u64;
                last_bytes = received;
                last_tick = Instant::now();

                let progress = if total_bytes > 0 {
                    (received as f32 / total_bytes as f32).min(1.0)
                } else {
                    0.0
                };

                let _ = proxy.send_event(IpcCommand::DownloadProgress {
                    payload: DownloadProgressPayload {
                        id: id.clone(),
                        received_bytes: received,
                        total_bytes,
                        speed_bytes_sec: speed_bps,
                        strands: 1,
                        strand_progress: vec![progress],
                    },
                });
            }
        } else {
            break;
        }
    }

    let _ = file.flush().await;
    drop(file);

    let success = final_dest_path.exists() && !cancel_flag.load(Ordering::Relaxed);
    let final_size = if success {
        std::fs::metadata(&final_dest_path)
            .map(|m| crate::tab_manager::format_bytes(m.len()))
            .unwrap_or_else(|_| "Unknown size".into())
    } else {
        "0 B".into()
    };

    let _ = proxy.send_event(IpcCommand::DownloadCompleted {
        payload: DownloadCompletedPayload {
            id: Some(id),
            url,
            path: final_dest_path.to_string_lossy().to_string(),
            success,
            size: final_size,
        },
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_download_manager_lifecycle() {
        let mgr = DownloadManager::new();
        let cancel = mgr.register_cancel("test-dl-1");
        assert!(!cancel.load(Ordering::Relaxed));

        mgr.cancel("test-dl-1");
        assert!(cancel.load(Ordering::Relaxed));

        mgr.cleanup("test-dl-1");
        mgr.cancel("test-dl-1");
    }

    #[test]
    fn test_extract_filename_from_headers() {
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert(
            CONTENT_DISPOSITION,
            "attachment; filename=\"sacred-tome.zip\"".parse().unwrap(),
        );
        let name = extract_filename_from_headers(&headers);
        assert_eq!(name.as_deref(), Some("sacred-tome.zip"));

        let mut utf8_headers = reqwest::header::HeaderMap::new();
        utf8_headers.insert(
            CONTENT_DISPOSITION,
            "attachment; filename*=UTF-8''bifrost_matrix.tar.gz".parse().unwrap(),
        );
        let utf8_name = extract_filename_from_headers(&utf8_headers);
        assert_eq!(utf8_name.as_deref(), Some("bifrost_matrix.tar.gz"));
    }
}
