use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ViewportBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum IpcCommand {
    #[serde(rename = "NAVIGATE")]
    Navigate { payload: NavigatePayload },

    #[serde(rename = "GO_BACK")]
    GoBack,

    #[serde(rename = "GO_FORWARD")]
    GoForward,

    #[serde(rename = "REFRESH")]
    Refresh,

    #[serde(rename = "CREATE_TAB")]
    CreateTab { payload: CreateTabPayload },

    #[serde(rename = "CLOSE_TAB")]
    CloseTab { payload: CloseTabPayload },

    #[serde(rename = "SWITCH_TAB")]
    SwitchTab { payload: SwitchTabPayload },

    #[serde(rename = "UPDATE_VIEWPORT_BOUNDS")]
    UpdateViewportBounds { payload: ViewportBounds },

    #[serde(rename = "WINDOW_MINIMIZE")]
    WindowMinimize,

    #[serde(rename = "WINDOW_MAXIMIZE")]
    WindowMaximize,

    #[serde(rename = "WINDOW_CLOSE")]
    WindowClose,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NavigatePayload {
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTabPayload {
    pub url: Option<String>,
    pub realm: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloseTabPayload {
    #[serde(rename = "tabId")]
    pub tab_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwitchTabPayload {
    #[serde(rename = "tabId")]
    pub tab_id: String,
}
