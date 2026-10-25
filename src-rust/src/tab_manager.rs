use std::collections::HashMap;
use std::sync::Arc;
use tao::dpi::{LogicalPosition, LogicalSize, Position, Size};
use tao::event_loop::EventLoopProxy;
use tao::window::Window;
use wry::{Rect, WebContext, WebView, WebViewBuilder};
use crate::ipc::{DownloadCompletedPayload, DownloadStartedPayload, IpcCommand, ViewportBounds};
use crate::logger;

pub fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.0} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

pub struct TabInstance {
    pub id: String,
    pub url: String,
    pub realm: String,
    pub webview: Option<WebView>,
}

pub struct TabManager {
    pub tabs: HashMap<String, TabInstance>,
    pub active_tab_id: Option<String>,
    pub current_bounds: Option<ViewportBounds>,
    pub proxy: Option<EventLoopProxy<IpcCommand>>,
    pub helheim_context: Option<WebContext>,
    pub adblocker: Arc<crate::adblocker::AdBlocker>,
}

impl TabManager {
    pub fn new() -> Self {
        let helheim_dir = std::env::temp_dir().join("mimir_helheim_isolated");
        let helheim_context = Some(WebContext::new(Some(helheim_dir)));
        let adblocker = Arc::new(crate::adblocker::AdBlocker::new());

        Self {
            tabs: HashMap::new(),
            active_tab_id: None,
            current_bounds: None,
            proxy: None,
            helheim_context,
            adblocker,
        }
    }

    pub fn set_proxy(&mut self, proxy: EventLoopProxy<IpcCommand>) {
        self.proxy = Some(proxy);
    }

    pub fn to_wry_rect(bounds: &ViewportBounds) -> Rect {
        Rect {
            position: Position::Logical(LogicalPosition::new(bounds.x as f64, bounds.y as f64)),
            size: Size::Logical(LogicalSize::new(bounds.width as f64, bounds.height as f64)),
        }
    }

    pub fn get_effective_bounds(&self) -> ViewportBounds {
        self.current_bounds.clone().unwrap_or(ViewportBounds {
            x: 240,
            y: 78,
            width: 1040,
            height: 690,
        })
    }

    pub fn update_bounds(&mut self, bounds: ViewportBounds) {
        let rect = Self::to_wry_rect(&bounds);
        self.current_bounds = Some(bounds);

        if let Some(active_id) = &self.active_tab_id {
            if let Some(tab) = self.tabs.get_mut(active_id) {
                if let Some(wv) = &mut tab.webview {
                    let _ = wv.set_bounds(rect);
                }
            }
        }
    }

    fn build_child_webview(
        &mut self,
        window: &Arc<Window>,
        rect: Rect,
        url: &str,
        realm: &str,
    ) -> Option<WebView> {
        let is_helheim = realm == "helheim";
        let mut builder = if is_helheim {
            if let Some(ctx) = &mut self.helheim_context {
                logger::info("Engaging isolated Helheim shroud (Ephemeral In-Private WebContext)");
                WebViewBuilder::with_web_context(ctx)
            } else {
                WebViewBuilder::new()
            }
        } else {
            WebViewBuilder::new()
        };

        builder = builder
            .with_bounds(rect)
            .with_url(url)
            .with_background_color((5, 7, 10, 255))
            .with_devtools(true);

        // 1. Download started handler
        if let Some(proxy_start) = self.proxy.clone() {
            builder = builder.with_download_started_handler(move |uri, path| {
                let filename = path
                    .file_name()
                    .map(|f| f.to_string_lossy().to_string())
                    .unwrap_or_else(|| "artifact".to_string());
                let id = format!(
                    "dl-{}",
                    std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_millis()
                );
                logger::info(&format!("Acquiring artifact from Bifröst: {} -> {}", uri, path.display()));
                let _ = proxy_start.send_event(IpcCommand::DownloadStarted {
                    payload: DownloadStartedPayload {
                        id,
                        filename,
                        url: uri,
                        path: path.to_string_lossy().to_string(),
                    },
                });
                true
            });
        }

        // 1b. Navigation handler: Intercept magnet URIs & .torrent files and channel to Naglfar Swarm
        if let Some(proxy_nav) = self.proxy.clone() {
            builder = builder.with_navigation_handler(move |uri| {
                let is_magnet = uri.starts_with("magnet:");
                let is_torrent = uri.ends_with(".torrent") || uri.contains(".torrent?");
                if is_magnet || is_torrent {
                    logger::info(&format!("ᛗ Intercepted torrent navigation: {}", uri));
                    let _ = proxy_nav.send_event(IpcCommand::AddTorrent {
                        payload: crate::ipc::AddTorrentPayload {
                            url_or_magnet: uri,
                            download_dir: None,
                        },
                    });
                    return false;
                }
                true
            });
        }

        // 2. Download completed handler
        if let Some(proxy_comp) = self.proxy.clone() {
            builder = builder.with_download_completed_handler(move |uri, path_opt, success| {
                let (path_str, size_str) = if let Some(p) = &path_opt {
                    let size = std::fs::metadata(p)
                        .map(|m| format_bytes(m.len()))
                        .unwrap_or_else(|_| "Unknown size".into());
                    (p.to_string_lossy().to_string(), size)
                } else {
                    ("".to_string(), "Unknown size".into())
                };

                logger::info(&format!(
                    "Artifact acquisition finished (success={}): {} ({})",
                    success, path_str, size_str
                ));

                if success && path_str.ends_with(".torrent") {
                    logger::info(&format!("ᛗ Ingesting completed .torrent artifact into Swarm: {}", path_str));
                    let _ = proxy_comp.send_event(IpcCommand::AddTorrent {
                        payload: crate::ipc::AddTorrentPayload {
                            url_or_magnet: path_str.clone(),
                            download_dir: None,
                        },
                    });
                }

                let _ = proxy_comp.send_event(IpcCommand::DownloadCompleted {
                    payload: DownloadCompletedPayload {
                        id: None,
                        url: uri,
                        path: path_str,
                        success,
                        size: size_str,
                    },
                });
            });
        }

        // 3. Script injection: Context menu interceptor + Sacred Shield (Adblock + YouTube Sentinel)
        let context_menu_script = r#"
        (function() {
            window.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                var linkEl = e.target.closest ? e.target.closest('a') : null;
                var imgEl = e.target.closest ? e.target.closest('img') : null;
                var sel = window.getSelection() ? window.getSelection().toString() : '';

                var payload = {
                    type: 'CONTEXT_MENU',
                    payload: {
                        x: e.clientX,
                        y: e.clientY,
                        linkUrl: linkEl ? linkEl.href : null,
                        imageUrl: imgEl ? imgEl.src : null,
                        selectedText: sel ? sel.trim() : null,
                        pageUrl: window.location.href,
                        pageTitle: document.title || window.location.hostname
                    }
                };

                if (window.ipc && typeof window.ipc.postMessage === 'function') {
                    window.ipc.postMessage(JSON.stringify(payload));
                } else if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
                    window.chrome.webview.postMessage(JSON.stringify(payload));
                }
            }, true);
        })();
        "#;

        let adblock_script = crate::adblocker::AdBlocker::generate_injection_script();
        let full_init_script = format!("{}\n{}", context_menu_script, adblock_script);
        builder = builder.with_initialization_script(&full_init_script);

        // 4. Child IPC handler for messages originating in child webview
        if let Some(proxy_ipc) = self.proxy.clone() {
            builder = builder.with_ipc_handler(move |req: wry::http::Request<String>| {
                let msg = req.body();
                match serde_json::from_str::<IpcCommand>(msg) {
                    Ok(cmd) => {
                        let _ = proxy_ipc.send_event(cmd);
                    }
                    Err(e) => {
                        logger::warn(&format!("Unrecognized rune from child webview: {} ({})", msg, e));
                    }
                }
            });
        }

        match builder.build_as_child(window.as_ref()) {
            Ok(wv) => {
                logger::info(&format!("Spawned child WebView2 for ({})", url));
                let _ = wv.set_visible(true);
                let _ = wv.focus();
                Some(wv)
            }
            Err(e) => {
                logger::error(&format!("Failed to spawn child WebView2 for {}: {}", url, e));
                None
            }
        }
    }

    pub fn open_or_navigate_tab(
        &mut self,
        window: &Arc<Window>,
        id: String,
        url: String,
        realm: String,
    ) {
        let is_internal = url.is_empty() || url == "mimir://newtab" || url == "about:blank";

        // Hide previous active tab if different from target tab
        if let Some(prev_id) = &self.active_tab_id {
            if prev_id != &id {
                if let Some(prev_tab) = self.tabs.get_mut(prev_id) {
                    if let Some(wv) = &mut prev_tab.webview {
                        let _ = wv.set_visible(false);
                    }
                }
            }
        }

        if is_internal {
            // Internal HUD page (The Well of Mímir) is rendered by the HUD itself,
            // so we hide target child WebView if any
            if let Some(tab) = self.tabs.get_mut(&id) {
                tab.url = url;
                tab.realm = realm;
                if let Some(wv) = &mut tab.webview {
                    let _ = wv.set_visible(false);
                }
            } else {
                self.tabs.insert(
                    id.clone(),
                    TabInstance {
                        id: id.clone(),
                        url,
                        realm,
                        webview: None,
                    },
                );
            }
            self.active_tab_id = Some(id);
            logger::info("Channeling internal Well of Mímir sanctuary; child webview hidden.");
            return;
        }

        let bounds = self.get_effective_bounds();
        let rect = Self::to_wry_rect(&bounds);

        // If tab already exists and has a webview, update its URL and show it
        let mut needs_spawn = false;
        if let Some(tab) = self.tabs.get_mut(&id) {
            tab.url = url.clone();
            tab.realm = realm.clone();

            if let Some(wv) = &mut tab.webview {
                let _ = wv.load_url(&url);
                let _ = wv.set_bounds(rect);
                let _ = wv.set_visible(true);
                let _ = wv.focus();
                logger::info(&format!("Navigated existing child WebView2 for tab {} to {}", id, url));
                self.active_tab_id = Some(id);
                return;
            } else {
                needs_spawn = true;
            }
        }

        // Spawn new child WebView2 docked into current_bounds
        let new_wv = self.build_child_webview(window, rect, &url, &realm);

        if needs_spawn {
            if let Some(tab) = self.tabs.get_mut(&id) {
                tab.webview = new_wv;
            }
        } else {
            self.tabs.insert(
                id.clone(),
                TabInstance {
                    id: id.clone(),
                    url,
                    realm,
                    webview: new_wv,
                },
            );
        }
        self.active_tab_id = Some(id);
    }

    pub fn navigate_active(&mut self, window: &Arc<Window>, url: &str, target_tab_id: Option<&str>) {
        let active_id = target_tab_id
            .map(|s| s.to_string())
            .or_else(|| self.active_tab_id.clone())
            .unwrap_or_else(|| "tab-1".to_string());

        let realm = self
            .tabs
            .get(&active_id)
            .map(|t| t.realm.clone())
            .unwrap_or_else(|| "midgard".to_string());

        logger::info(&format!("Navigating tab {} in realm {} to: {}", active_id, realm, url));
        self.open_or_navigate_tab(window, active_id, url.to_string(), realm);
    }

    pub fn switch_tab(&mut self, id: &str) {
        if self.active_tab_id.as_deref() == Some(id) {
            return;
        }

        // Hide current active tab
        if let Some(current_id) = &self.active_tab_id {
            if let Some(current_tab) = self.tabs.get_mut(current_id) {
                if let Some(wv) = &mut current_tab.webview {
                    let _ = wv.set_visible(false);
                }
            }
        }

        let bounds = self.get_effective_bounds();

        // Show and resize new active tab
        if let Some(new_tab) = self.tabs.get_mut(id) {
            let is_internal = new_tab.url.is_empty() || new_tab.url == "mimir://newtab" || new_tab.url == "about:blank";
            if let Some(wv) = &mut new_tab.webview {
                if is_internal {
                    let _ = wv.set_visible(false);
                } else {
                    let _ = wv.set_bounds(Self::to_wry_rect(&bounds));
                    let _ = wv.set_visible(true);
                    let _ = wv.focus();
                }
            }
            self.active_tab_id = Some(id.to_string());
        }
    }

    pub fn remove_tab(&mut self, id: &str) {
        if let Some(mut tab) = self.tabs.remove(id) {
            if let Some(wv) = tab.webview.take() {
                let _ = wv.set_visible(false);
                drop(wv);
            }
        }

        if self.active_tab_id.as_deref() == Some(id) {
            let next_id = self.tabs.keys().next().cloned();
            if let Some(next) = next_id {
                self.switch_tab(&next);
            } else {
                self.active_tab_id = None;
            }
        }
    }

    pub fn go_back(&self) {
        if let Some(active_id) = &self.active_tab_id {
            if let Some(tab) = self.tabs.get(active_id) {
                if let Some(wv) = &tab.webview {
                    let _ = wv.evaluate_script("window.history.back()");
                }
            }
        }
    }

    pub fn go_forward(&self) {
        if let Some(active_id) = &self.active_tab_id {
            if let Some(tab) = self.tabs.get(active_id) {
                if let Some(wv) = &tab.webview {
                    let _ = wv.evaluate_script("window.history.forward()");
                }
            }
        }
    }

    pub fn refresh(&self) {
        if let Some(active_id) = &self.active_tab_id {
            if let Some(tab) = self.tabs.get(active_id) {
                if let Some(wv) = &tab.webview {
                    let _ = wv.evaluate_script("window.location.reload()");
                }
            }
        }
    }

    pub fn zoom_in(&self) {
        self.execute_on_active("document.body.style.zoom = (parseFloat(document.body.style.zoom || '1') + 0.1).toString()");
    }

    pub fn zoom_out(&self) {
        self.execute_on_active("document.body.style.zoom = Math.max(0.3, parseFloat(document.body.style.zoom || '1') - 0.1).toString()");
    }

    pub fn zoom_reset(&self) {
        self.execute_on_active("document.body.style.zoom = '1'");
    }

    pub fn print_page(&self) {
        self.execute_on_active("window.print()");
    }

    pub fn open_devtools(&self) {
        if let Some(active_id) = &self.active_tab_id {
            if let Some(tab) = self.tabs.get(active_id) {
                if let Some(wv) = &tab.webview {
                    wv.open_devtools();
                }
            }
        }
    }

    pub fn find_in_page(&self, query: &str, case_sensitive: bool, use_regex: bool) {
        let escaped = query.replace('\\', "\\\\").replace('\'', "\\'");
        let script = format!(
            r#"(function() {{
                try {{
                    window.find('{}', {}, false, true, false, true, false);
                    window.__mimirLastFind = '{}';
                    window.__mimirCaseSensitive = {};

                    var q = '{}';
                    var isCase = {};
                    var isRegex = {};
                    var text = document.body ? (document.body.innerText || '') : '';
                    var count = 0;
                    if (isRegex) {{
                        try {{
                            var re = new RegExp(q, isCase ? 'g' : 'gi');
                            var m = text.match(re);
                            count = m ? m.length : 0;
                        }} catch(err) {{ count = 0; }}
                    }} else if (q) {{
                        var esc = q.replace(/[.*+?^${{}}()|[\]\\]/g, '\\$&');
                        var re = new RegExp(esc, isCase ? 'g' : 'gi');
                        var m = text.match(re);
                        count = m ? m.length : 0;
                    }}
                    var p = {{ type: 'FIND_RESULT', payload: {{ count: count, query: q }} }};
                    if (window.ipc && typeof window.ipc.postMessage === 'function') {{
                        window.ipc.postMessage(JSON.stringify(p));
                    }} else if (window.chrome && window.chrome.webview) {{
                        window.chrome.webview.postMessage(JSON.stringify(p));
                    }}
                }} catch(e) {{}}
            }})();"#,
            escaped, case_sensitive, escaped, case_sensitive, escaped, case_sensitive, use_regex
        );
        self.execute_on_active(&script);
    }

    pub fn find_next(&self) {
        self.execute_on_active(
            "if(window.__mimirLastFind){window.find(window.__mimirLastFind, window.__mimirCaseSensitive || false, false, true, false, true, false)}"
        );
    }

    pub fn find_previous(&self) {
        self.execute_on_active(
            "if(window.__mimirLastFind){window.find(window.__mimirLastFind, window.__mimirCaseSensitive || false, true, true, false, true, false)}"
        );
    }

    pub fn find_close(&self) {
        self.execute_on_active("window.getSelection().removeAllRanges(); window.__mimirLastFind=null;");
    }

    pub fn duplicate_tab(&mut self, window: &Arc<Window>, source_id: &str, new_id: String) {
        if let Some(source) = self.tabs.get(source_id) {
            let url = source.url.clone();
            let realm = source.realm.clone();
            if !url.is_empty() && url != "mimir://newtab" {
                self.open_or_navigate_tab(window, new_id, url, realm);
            }
        }
    }

    pub fn execute_script_on_active(&self, script: &str) {
        self.execute_on_active(script);
    }

    fn execute_on_active(&self, script: &str) {
        if let Some(active_id) = &self.active_tab_id {
            if let Some(tab) = self.tabs.get(active_id) {
                if let Some(wv) = &tab.webview {
                    let _ = wv.evaluate_script(script);
                }
            }
        }
    }
}
