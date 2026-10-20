use std::collections::HashMap;
use crate::ipc::ViewportBounds;

#[derive(Debug, Clone)]
pub struct TabInfo {
    pub id: String,
    pub url: String,
    pub realm: String,
}

pub struct TabManager {
    pub tabs: HashMap<String, TabInfo>,
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

    pub fn add_tab(&mut self, id: String, url: String, realm: String) {
        self.tabs.insert(
            id.clone(),
            TabInfo {
                id: id.clone(),
                url,
                realm,
            },
        );
        self.active_tab_id = Some(id);
    }

    pub fn remove_tab(&mut self, id: &str) {
        self.tabs.remove(id);
        if self.active_tab_id.as_deref() == Some(id) {
            self.active_tab_id = self.tabs.keys().next().cloned();
        }
    }

    pub fn switch_tab(&mut self, id: &str) {
        if self.tabs.contains_key(id) {
            self.active_tab_id = Some(id.to_string());
        }
    }

    pub fn update_bounds(&mut self, bounds: ViewportBounds) {
        self.current_bounds = Some(bounds);
    }
}
