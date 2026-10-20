use std::collections::HashMap;
use std::sync::Arc;
use tao::dpi::{LogicalPosition, LogicalSize, Position, Size};
use tao::window::Window;
use wry::{Rect, WebView, WebViewBuilder};
use crate::ipc::ViewportBounds;
use crate::logger;

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
}

impl TabManager {
    pub fn new() -> Self {
        Self {
            tabs: HashMap::new(),
            active_tab_id: None,
            current_bounds: None,
        }
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

        // If tab already exists, update its URL and show its child webview
        if let Some(tab) = self.tabs.get_mut(&id) {
            tab.url = url.clone();
            tab.realm = realm.clone();

            if let Some(wv) = &mut tab.webview {
                let _ = wv.load_url(&url);
                let _ = wv.set_bounds(rect);
                let _ = wv.set_visible(true);
                let _ = wv.focus();
                logger::info(&format!("Navigated existing child WebView2 for tab {} to {}", id, url));
            } else {
                // Spawn child WebView2 docked into viewport bounds
                match WebViewBuilder::new()
                    .with_bounds(rect)
                    .with_url(&url)
                    .with_background_color((5, 7, 10, 255))
                    .with_devtools(true)
                    .build_as_child(window.as_ref())
                {
                    Ok(wv) => {
                        logger::info(&format!("Spawned child WebView2 for tab {} ({})", id, url));
                        let _ = wv.set_visible(true);
                        let _ = wv.focus();
                        tab.webview = Some(wv);
                    }
                    Err(e) => {
                        logger::error(&format!("Failed to spawn child WebView2 for tab {}: {}", id, e));
                    }
                }
            }
            self.active_tab_id = Some(id);
            return;
        }

        // Spawn new child WebView2 docked into current_bounds
        let new_wv = match WebViewBuilder::new()
            .with_bounds(rect)
            .with_url(&url)
            .with_background_color((5, 7, 10, 255))
            .with_devtools(true)
            .build_as_child(window.as_ref())
        {
            Ok(wv) => {
                logger::info(&format!("Spawned new child WebView2 for tab {} ({})", id, url));
                let _ = wv.set_visible(true);
                let _ = wv.focus();
                Some(wv)
            }
            Err(e) => {
                logger::error(&format!("Failed to spawn child WebView2 for tab {}: {}", id, e));
                None
            }
        };

        self.tabs.insert(
            id.clone(),
            TabInstance {
                id: id.clone(),
                url,
                realm,
                webview: new_wv,
            },
        );
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
}
