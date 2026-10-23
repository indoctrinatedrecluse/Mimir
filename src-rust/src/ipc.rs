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

    #[serde(rename = "ZOOM_IN")]
    ZoomIn,

    #[serde(rename = "ZOOM_OUT")]
    ZoomOut,

    #[serde(rename = "ZOOM_RESET")]
    ZoomReset,

    #[serde(rename = "PRINT")]
    Print,

    #[serde(rename = "FIND_IN_PAGE")]
    FindInPage { payload: FindInPagePayload },

    #[serde(rename = "FIND_NEXT")]
    FindNext,

    #[serde(rename = "FIND_PREVIOUS")]
    FindPrevious,

    #[serde(rename = "FIND_CLOSE")]
    FindClose,

    #[serde(rename = "DUPLICATE_TAB")]
    DuplicateTab { payload: DuplicateTabPayload },

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
    #[serde(default, rename = "tabId")]
    pub tab_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTabPayload {
    #[serde(default, rename = "tabId")]
    pub tab_id: Option<String>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FindInPagePayload {
    pub query: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateTabPayload {
    #[serde(rename = "tabId")]
    pub tab_id: String,
    #[serde(rename = "newTabId")]
    pub new_tab_id: String,
}
