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

    #[serde(rename = "OPEN_PATH")]
    OpenPath { payload: OpenPathPayload },

    #[serde(rename = "DOWNLOAD_URL")]
    DownloadUrl { payload: DownloadUrlPayload },

    #[serde(rename = "DELETE_FILE")]
    DeleteFile { payload: DeleteFilePayload },

    #[serde(rename = "SHOW_DEVTOOLS")]
    ShowDevtools,

    #[serde(rename = "EXECUTE_SCRIPT")]
    ExecuteScript { payload: ExecuteScriptPayload },

    #[serde(rename = "WINDOW_MINIMIZE")]
    WindowMinimize,

    #[serde(rename = "WINDOW_MAXIMIZE")]
    WindowMaximize,

    #[serde(rename = "WINDOW_CLOSE")]
    WindowClose,

    #[serde(rename = "CANCEL_DOWNLOAD")]
    CancelDownload { payload: CancelDownloadPayload },

    #[serde(rename = "CALCULATE_HASH")]
    CalculateHash { payload: CalculateHashPayload },

    // Internal and child webview relayed events
    #[serde(rename = "DOWNLOAD_STARTED")]
    DownloadStarted { payload: DownloadStartedPayload },

    #[serde(rename = "DOWNLOAD_COMPLETED")]
    DownloadCompleted { payload: DownloadCompletedPayload },

    #[serde(rename = "CONTEXT_MENU")]
    ContextMenu { payload: ContextMenuPayload },

    #[serde(rename = "TRACKER_BLOCKED")]
    TrackerBlocked { payload: TrackerBlockedPayload },

    #[serde(rename = "FIND_RESULT")]
    FindResult { payload: FindResultPayload },

    #[serde(rename = "HASH_RESULT")]
    HashResult { payload: HashResultPayload },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenPathPayload {
    pub path: String,
    #[serde(default, rename = "isDir")]
    pub is_dir: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadUrlPayload {
    pub url: String,
    pub filename: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteFilePayload {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadStartedPayload {
    pub id: String,
    pub filename: String,
    pub url: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadCompletedPayload {
    pub url: String,
    pub path: String,
    pub success: bool,
    pub size: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextMenuPayload {
    pub x: i32,
    pub y: i32,
    #[serde(default, rename = "linkUrl")]
    pub link_url: Option<String>,
    #[serde(default, rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(default, rename = "selectedText")]
    pub selected_text: Option<String>,
    #[serde(default, rename = "pageUrl")]
    pub page_url: String,
    #[serde(default, rename = "pageTitle")]
    pub page_title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackerBlockedPayload {
    pub domain: String,
    pub category: String,
    pub url: String,
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
    #[serde(default, rename = "caseSensitive")]
    pub case_sensitive: bool,
    #[serde(default, rename = "useRegex")]
    pub use_regex: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FindResultPayload {
    pub count: usize,
    pub query: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CancelDownloadPayload {
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalculateHashPayload {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashResultPayload {
    pub path: String,
    pub hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateTabPayload {
    #[serde(rename = "tabId")]
    pub tab_id: String,
    #[serde(rename = "newTabId")]
    pub new_tab_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteScriptPayload {
    pub script: String,
}


