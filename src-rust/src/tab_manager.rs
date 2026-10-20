use std::collections::HashMap;
use std::sync::Arc;
use tao::dpi::{LogicalPosition, LogicalSize, Position, Size};
use tao::window::Window;
use wry::{Rect, WebView, WebViewBuilder};
use crate::ipc::ViewportBounds;

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

        if is_internal {
            // Internal HUD page (The Well of Mímir) is rendered by the HUD itself,
            // so we hide any active native child WebView
            if let Some(active_id) = &self.active_tab_id {
                if let Some(tab) = self.tabs.get_mut(active_id) {
                    if let Some(wv) = &mut tab.webview {
                        let _ = wv.set_visible(false);
                    }
                }
            }
            self.tabs.insert(
                id.clone(),
                TabInstance {
                    id: id.clone(),
                    url,
                    realm,
                    webview: None,
                },
            );
            self.active_tab_id = Some(id);
            return;
        }

        // If tab already exists, update its URL
        if let Some(tab) = self.tabs.get_mut(&id) {
            tab.url = url.clone();
            if let Some(wv) = &mut tab.webview {
                let _ = wv.load_url(&url);
                if let Some(bounds) = &self.current_bounds {
                    let _ = wv.set_bounds(Self::to_wry_rect(bounds));
                }
                let _ = wv.set_visible(true);
            } else if let Some(bounds) = &self.current_bounds {
                // Spawn WebView2 if it was previously an internal tab
                if let Ok(wv) = WebViewBuilder::new()
                    .with_bounds(Self::to_wry_rect(bounds))
                    .with_url(&url)
                    .build(window)
                {
                    tab.webview = Some(wv);
                }
            }
            self.active_tab_id = Some(id);
            return;
        }

        // Hide previous active tab
        if let Some(prev_id) = &self.active_tab_id {
            if let Some(prev_tab) = self.tabs.get_mut(prev_id) {
                if let Some(wv) = &mut prev_tab.webview {
                    let _ = wv.set_visible(false);
                }
            }
        }

        // Spawn new child WebView2 docked into current_bounds
        let new_wv = if let Some(bounds) = &self.current_bounds {
            WebViewBuilder::new()
                .with_bounds(Self::to_wry_rect(bounds))
                .with_url(&url)
                .build(window)
                .ok()
        } else {
            WebViewBuilder::new().with_url(&url).build(window).ok()
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

    pub fn navigate_active(&mut self, window: &Arc<Window>, url: &str) {
        if let Some(active_id) = self.active_tab_id.clone() {
            let realm = self
                .tabs
                .get(&active_id)
                .map(|t| t.realm.clone())
                .unwrap_or_else(|| "midgard".to_string());
            self.open_or_navigate_tab(window, active_id, url.to_string(), realm);
        }
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

        // Show and resize new active tab
        if let Some(new_tab) = self.tabs.get_mut(id) {
            if let Some(wv) = &mut new_tab.webview {
                if let Some(bounds) = &self.current_bounds {
                    let _ = wv.set_bounds(Self::to_wry_rect(bounds));
                }
                let _ = wv.set_visible(true);
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
}
