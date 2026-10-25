#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(dead_code)]

mod ipc;
mod logger;
mod tab_manager;
mod accelerator;
mod torrent;
mod adblocker;
pub mod media_drm;

use std::borrow::Cow;
use std::path::PathBuf;
use std::sync::Arc;
use tao::{
    dpi::LogicalSize,
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoopBuilder},
    window::{Icon, WindowBuilder},
};
use wry::http::{header, Response, StatusCode};
use wry::WebViewBuilder;
#[cfg(target_os = "windows")]
use wry::WebViewBuilderExtWindows;
use ipc::IpcCommand;
use tab_manager::TabManager;

/// Verifies that Microsoft Edge WebView2 Runtime is available on the machine.
/// If absent, prompts the user to download and install it automatically, or runs
/// a bundled MicrosoftEdgeWebview2Setup.exe if found next to the executable.
#[cfg(target_os = "windows")]
fn ensure_webview2_installed() -> Result<(), String> {
    use windows::Win32::System::Registry::{
        RegCloseKey, RegOpenKeyExW, RegQueryValueExW, HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE, KEY_READ,
    };
    use windows::core::w;

    let subkeys = [
        w!(r"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"),
        w!(r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"),
        w!(r"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-9447-402A-8377-800732A6A5E2}"),
        w!(r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-9447-402A-8377-800732A6A5E2}"),
    ];

    let mut found = false;
    for root in [HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER] {
        for subkey in &subkeys {
            unsafe {
                let mut hkey = Default::default();
                if RegOpenKeyExW(root, *subkey, 0, KEY_READ, &mut hkey).is_ok() {
                    let mut buffer = [0u16; 128];
                    let mut size = (buffer.len() * 2) as u32;
                    let res = RegQueryValueExW(
                        hkey,
                        w!("pv"),
                        None,
                        None,
                        Some(buffer.as_mut_ptr() as *mut _),
                        Some(&mut size),
                    );
                    let _ = RegCloseKey(hkey);
                    if res.is_ok() && size > 2 && buffer[0] != 0 {
                        let version_str = String::from_utf16_lossy(&buffer[..(size as usize / 2) - 1]);
                        logger::info(&format!("Microsoft Edge WebView2 Evergreen Runtime detected (v{}).", version_str));
                        found = true;
                        break;
                    }
                }
            }
        }
        if found {
            break;
        }
    }

    if !found {
        let evergreen_dir = PathBuf::from(r"C:\Program Files (x86)\Microsoft\EdgeWebView\Application");
        if evergreen_dir.exists() {
            logger::info(&format!("Microsoft Edge WebView2 Evergreen Runtime found at: {}", evergreen_dir.display()));
            found = true;
        }
    }

    if found {
        return Ok(());
    }

    logger::warn("Microsoft Edge WebView2 Runtime not detected in registry. Prompting user for bootstrap installation.");

    // Check if installer is already present next to executable
    let bundled_installer = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|d| d.join("MicrosoftEdgeWebview2Setup.exe")))
        .filter(|p| p.exists());

    let should_install = logger::ask_yes_no_dialog(
        "ᛗ Mímir — Microsoft Edge WebView2 Required",
        "ᛗ Mímir requires the Microsoft Edge WebView2 Runtime to explore the web, but it was not detected on this system.\n\n\
         Would you like ᛗ Mímir to download and install it automatically now? (Recommended)",
    );

    if !should_install {
        return Err("User declined WebView2 installation. ᛗ Mímir requires a web runtime to operate.".into());
    }

    let installer_path = if let Some(path) = bundled_installer {
        path
    } else {
        // Download Microsoft's official WebView2 Evergreen Bootstrapper to %TEMP%
        let temp_installer = std::env::temp_dir().join("MicrosoftEdgeWebview2Setup.exe");
        logger::info(&format!("Downloading official WebView2 Evergreen bootstrapper to {}...", temp_installer.display()));

        let download_cmd = format!(
            "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; \
             Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/p/?LinkId=2124703' -OutFile '{}'",
            temp_installer.display()
        );

        let status = std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &download_cmd])
            .status();

        match status {
            Ok(s) if s.success() => {
                logger::info("WebView2 Bootstrapper downloaded successfully.");
                temp_installer
            }
            _ => {
                let err_msg = "Failed to download MicrosoftEdgeWebview2Setup.exe. Please install WebView2 manually from Microsoft.";
                logger::error(err_msg);
                return Err(err_msg.into());
            }
        }
    };

    // Execute bootstrapper silently
    logger::info(&format!("Executing WebView2 bootstrapper: {}", installer_path.display()));
    let install_status = std::process::Command::new(&installer_path)
        .arg("/silent")
        .arg("/install")
        .status();

    match install_status {
        Ok(s) if s.success() => {
            logger::info("WebView2 installation completed successfully.");
            Ok(())
        }
        Ok(s) => {
            logger::warn(&format!("WebView2 bootstrapper finished with exit code: {}", s));
            Ok(())
        }
        Err(e) => {
            let msg = format!("Failed to launch WebView2 bootstrapper: {}", e);
            logger::error(&msg);
            Err(msg)
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn ensure_webview2_installed() -> Result<(), String> {
    Ok(())
}

/// Discovers the local `dist` directory holding compiled frontend assets.
fn resolve_dist_dir() -> Option<PathBuf> {
    // 1. Explicit dev environment flag overrides disk discovery
    if std::env::var("MIMIR_DEV").is_ok() {
        logger::info("MIMIR_DEV environment variable detected; channeling HUD from dev server: http://localhost:5173");
        return None;
    }

    let mut candidate_dirs: Vec<PathBuf> = Vec::new();

    // Check relative to executable location (highest priority for installed & portable packages)
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            // Standard packaged structure: <install_dir>/mimir.exe -> <install_dir>/dist
            candidate_dirs.push(exe_dir.join("dist"));
            // Cargo target inside subcrate: <repo>/src-rust/target/(release|debug)/mimir-core.exe -> <repo>/dist (3 levels up)
            candidate_dirs.push(exe_dir.join("..").join("..").join("..").join("dist"));
            // Cargo target at repo root: <repo>/target/(release|debug)/mimir-core.exe -> <repo>/dist (2 levels up)
            candidate_dirs.push(exe_dir.join("..").join("..").join("dist"));
            candidate_dirs.push(exe_dir.join("..").join("dist"));
        }
    }

    // Check relative to current working directory
    if let Ok(cwd) = std::env::current_dir() {
        candidate_dirs.push(cwd.join("dist"));
        candidate_dirs.push(cwd.join("..").join("dist"));
        candidate_dirs.push(cwd.join("..").join("..").join("dist"));
    }

    for dir in candidate_dirs {
        if dir.exists() && dir.join("index.html").exists() {
            let canon = dir.canonicalize().unwrap_or(dir);
            let canon_str = canon.to_string_lossy().to_string();
            // On Windows, canonicalize() prepends '\\?\' verbatim prefix.
            // In verbatim paths, Win32 disables forward slash conversion, causing PathBuf::join("assets/xxx.js")
            // to fail with ERROR_INVALID_NAME / File Not Found.
            let clean_str = canon_str.strip_prefix(r"\\?\").unwrap_or(&canon_str);
            let cleaned = PathBuf::from(clean_str);
            logger::info(&format!("Discovered local frontend asset sanctuary: {}", cleaned.display()));
            return Some(cleaned);
        }
    }

    None
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // If launched from an existing terminal (PowerShell or cmd), attach to it so stdout/stderr work.
    // If launched by double-clicking the exe in Explorer, AttachConsole returns false and no console window appears.
    #[cfg(target_os = "windows")]
    unsafe {
        use windows::Win32::System::Console::{AttachConsole, ATTACH_PARENT_PROCESS};
        let _ = AttachConsole(ATTACH_PARENT_PROCESS);
    }

    // Initialize diagnostic logger and crash dump hook in %TEMP%
    logger::init();

    if std::env::args().any(|arg| arg == "--version" || arg == "-V") {
        println!("ᛗ Mímir Browser Core v{} (Runic Conduit)", env!("CARGO_PKG_VERSION"));
        return Ok(());
    }

    // Dependency verification: Ensure Microsoft Edge WebView2 runtime is present
    if let Err(err) = ensure_webview2_installed() {
        logger::error(&format!("Runtime dependency check failed: {}", err));
        logger::show_native_error_dialog("ᛗ Mímir — Missing Runtime Dependency", &err);
        return Err(err.into());
    }

    // Direct WebView2 data and cache away from the project workspace to prevent file lock
    // collisions with Vite's watcher
    let data_dir = match std::env::var("WEBVIEW2_USER_DATA_FOLDER") {
        Ok(dir_str) => PathBuf::from(dir_str),
        Err(_) => {
            let dir = std::env::temp_dir().join("mimir_webview2_data");
            logger::info(&format!("Setting WebView2 user data directory: {}", dir.display()));
            std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", &dir);
            dir
        }
    };

    // Configure streaming DRM protocols, Widevine seeding, and media hardware acceleration
    media_drm::configure_media_environment(&data_dir);

    let event_loop = EventLoopBuilder::<IpcCommand>::with_user_event().build();
    let event_loop_proxy = event_loop.create_proxy();

    let icon_bytes = include_bytes!("../icon_64.rgba");
    let window_icon = Icon::from_rgba(icon_bytes.to_vec(), 64, 64).ok();

    // Create a modern borderless native window for the ᛗ Mímir HUD
    let window = match WindowBuilder::new()
        .with_title("ᛗ Mímir Browser — Runic Conduit")
        .with_window_icon(window_icon)
        .with_inner_size(LogicalSize::new(1280.0, 800.0))
        .with_min_inner_size(LogicalSize::new(960.0, 600.0))
        .with_decorations(false) // Custom Norse HUD TitleBar handles window controls
        .build(&event_loop)
    {
        Ok(win) => Arc::new(win),
        Err(e) => {
            let err_msg = format!("Failed to create ᛗ Mímir window frame: {}", e);
            logger::error(&err_msg);
            logger::show_native_error_dialog("ᛗ Mímir Window Creation Error", &err_msg);
            return Err(e.into());
        }
    };

    let dist_dir_opt = resolve_dist_dir();

    // Build the primary HUD WebView
    let mut builder = WebViewBuilder::new()
        .with_background_color((5, 7, 10, 255)) // Deep void-obsidian background (#05070a) to prevent white flash
        .with_devtools(true); // Allow developer inspection in HUD

    #[cfg(target_os = "windows")]
    {
        builder = builder.with_https_scheme(true);
    }

    let hud_url: String;

    if let Some(dist_dir) = dist_dir_opt {
        hud_url = "https://mimir.localhost/index.html".to_string();
        logger::info(&format!("Channeling HUD via secure custom protocol: {}", hud_url));

        let dist_dir_clone = dist_dir.clone();
        builder = builder.with_custom_protocol("mimir".into(), move |_id, request| {
            let path_raw = request.uri().path();
            let decoded_path = percent_encoding::percent_decode_str(path_raw)
                .decode_utf8_lossy()
                .to_string();

            // Normalize path: strip leading slashes and convert forward slashes to system separator
            let trimmed = decoded_path.trim_start_matches('/');
            let rel_path = if trimmed.is_empty() {
                "index.html".to_string()
            } else {
                trimmed.replace('/', std::path::MAIN_SEPARATOR_STR)
            };

            let file_path = dist_dir_clone.join(&rel_path);
            let has_extension = file_path.extension().is_some();

            if file_path.is_file() {
                if let Ok(bytes) = std::fs::read(&file_path) {
                    let mime = match file_path.extension().and_then(|s| s.to_str()).unwrap_or("") {
                        "html" => "text/html; charset=utf-8",
                        "js" | "mjs" => "text/javascript; charset=utf-8",
                        "css" => "text/css; charset=utf-8",
                        "svg" => "image/svg+xml",
                        "json" => "application/json",
                        "png" => "image/png",
                        "jpg" | "jpeg" => "image/jpeg",
                        "ico" => "image/x-icon",
                        "woff" => "font/woff",
                        "woff2" => "font/woff2",
                        "ttf" => "font/ttf",
                        "wasm" => "application/wasm",
                        "mp4" => "video/mp4",
                        "webm" => "video/webm",
                        _ => "application/octet-stream",
                    };

                    logger::info(&format!("[HTTP 200] Channeling asset: {} (MIME: {})", path_raw, mime));

                    return Response::builder()
                        .status(StatusCode::OK)
                        .header(header::CONTENT_TYPE, mime)
                        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                        .body(Cow::Owned(bytes))
                        .unwrap();
                }
            }

            // SPA route fallback: ONLY for navigation routes (no file extension), return index.html
            if !has_extension {
                let index_path = dist_dir_clone.join("index.html");
                if index_path.exists() {
                    if let Ok(bytes) = std::fs::read(&index_path) {
                        logger::info(&format!("[HTTP 200 SPA Fallback] Serving index.html for route: {}", path_raw));
                        return Response::builder()
                            .status(StatusCode::OK)
                            .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
                            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                            .body(Cow::Owned(bytes))
                            .unwrap();
                    }
                }
            }

            logger::warn(&format!("[HTTP 404] Runic Asset Not Found: {} (Resolved: {})", path_raw, file_path.display()));
            Response::builder()
                .status(StatusCode::NOT_FOUND)
                .header(header::CONTENT_TYPE, "text/plain; charset=utf-8")
                .body(Cow::Borrowed(&b"Runic Asset Not Found"[..]))
                .unwrap()
        });
    } else {
        hud_url = "http://localhost:5173".to_string();
        logger::warn("Dist directory not found or MIMIR_DEV set. Defaulting to live dev server: http://localhost:5173");
    }

    let proxy_clone = event_loop_proxy.clone();
    let _hud_webview = match builder
        .with_url(&hud_url)
        .with_ipc_handler(move |req: wry::http::Request<String>| {
            let msg = req.body();
            match serde_json::from_str::<IpcCommand>(msg) {
                Ok(cmd) => {
                    if let Err(e) = proxy_clone.send_event(cmd) {
                        logger::error(&format!("Failed to post IPC rune to event loop: {}", e));
                    }
                }
                Err(_e) => {
                    logger::warn(&format!("Received unrecognized IPC rune: {}", msg));
                }
            }
        })
        .build(&window)
    {
        Ok(wv) => wv,
        Err(e) => {
            let err_msg = format!(
                "Failed to initialize Microsoft Edge WebView2 runtime: {}\n\n\
                 Please ensure the WebView2 Runtime is installed on this system.\n\
                 Crash log: {}",
                e,
                logger::get_log_path().display()
            );
            logger::error(&err_msg);
            logger::show_native_error_dialog("ᛗ Mímir Engine Initialization Error", &err_msg);
            return Err(e.into());
        }
    };

    let mut tab_manager = TabManager::new();
    tab_manager.set_proxy(event_loop_proxy.clone());
    let window_clone = Arc::clone(&window);
    let _hud = _hud_webview;

    let download_mgr = Arc::new(accelerator::DownloadManager::new());
    let rt = Arc::new(
        tokio::runtime::Builder::new_multi_thread()
            .worker_threads(4)
            .enable_all()
            .build()
            .expect("Failed to initialize Bifröst async runtime")
    );

    let default_download_dir = if let Ok(userprofile) = std::env::var("USERPROFILE") {
        let p = std::path::PathBuf::from(userprofile).join("Downloads");
        if p.exists() {
            p
        } else {
            std::env::temp_dir()
        }
    } else {
        std::env::temp_dir()
    };

    let torrent_mgr = rt.block_on(async {
        torrent::TorrentManager::new(default_download_dir.clone(), event_loop_proxy.clone()).await
    }).ok();

    logger::info("ᛗ Mímir Runic Conduit event loop running.");

    let mut pip_window: Option<Arc<tao::window::Window>> = None;
    let mut pip_webview: Option<wry::WebView> = None;

    // Run Tao event loop
    event_loop.run(move |event, event_loop_target, control_flow| {
        *control_flow = ControlFlow::Wait;
        let _keep_hud = &_hud;

        match event {
            Event::UserEvent(cmd) => match cmd {
                IpcCommand::WindowMinimize => {
                    window_clone.set_minimized(true);
                }
                IpcCommand::WindowMaximize => {
                    let is_max = window_clone.is_maximized();
                    window_clone.set_maximized(!is_max);
                }
                IpcCommand::WindowClose => {
                    logger::info("WindowClose command received from HUD. Shutting down.");
                    *control_flow = ControlFlow::Exit;
                    std::process::exit(0);
                }
                IpcCommand::UpdateViewportBounds { payload } => {
                    logger::info(&format!(
                        "Updating viewport sanctuary bounds: x={}, y={}, w={}, h={}",
                        payload.x, payload.y, payload.width, payload.height
                    ));
                    tab_manager.update_bounds(payload);
                }
                IpcCommand::Navigate { payload } => {
                    logger::info(&format!(
                        "Commencing navigation across Bifröst: {} (target tab: {:?})",
                        payload.url, payload.tab_id
                    ));
                    tab_manager.navigate_active(&window_clone, &payload.url, payload.tab_id.as_deref());
                }
                IpcCommand::CreateTab { payload } => {
                    let tab_id = payload.tab_id.unwrap_or_else(|| {
                        format!(
                            "tab-{}",
                            std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap()
                                .as_millis()
                        )
                    });
                    logger::info(&format!(
                        "Growing new Yggdrasil branch: {} in realm: {}",
                        tab_id, payload.realm
                    ));
                    let url = payload.url.unwrap_or_else(|| "mimir://newtab".to_string());
                    tab_manager.open_or_navigate_tab(&window_clone, tab_id, url, payload.realm);
                }
                IpcCommand::CloseTab { payload } => {
                    logger::info(&format!("Severing Yggdrasil thread: {}", payload.tab_id));
                    tab_manager.remove_tab(&window_clone, &payload.tab_id);
                }
                IpcCommand::SwitchTab { payload } => {
                    logger::info(&format!("Switching active thread to: {}", payload.tab_id));
                    tab_manager.switch_tab(&window_clone, &payload.tab_id);
                }
                IpcCommand::SuspendTab { payload } => {
                    logger::info(&format!("Einherjar Slumber requested for tab: {}", payload.tab_id));
                    tab_manager.suspend_tab(&payload.tab_id);
                }
                IpcCommand::ResumeTab { payload } => {
                    logger::info(&format!("Einherjar Awakening requested for tab: {}", payload.tab_id));
                    tab_manager.resume_tab(&window_clone, &payload.tab_id);
                }
                IpcCommand::GoBack => {
                    logger::info("Rewinding memory (Back)");
                    tab_manager.go_back();
                }
                IpcCommand::GoForward => {
                    logger::info("Advancing vision (Forward)");
                    tab_manager.go_forward();
                }
                IpcCommand::Refresh => {
                    logger::info("Refreshing sacred spring (Reload)");
                    tab_manager.refresh();
                }
                IpcCommand::ZoomIn => {
                    logger::info("Zooming in (Enlarging runes)");
                    tab_manager.zoom_in();
                }
                IpcCommand::ZoomOut => {
                    logger::info("Zooming out (Diminishing runes)");
                    tab_manager.zoom_out();
                }
                IpcCommand::ZoomReset => {
                    logger::info("Resetting zoom (Restoring rune scale)");
                    tab_manager.zoom_reset();
                }
                IpcCommand::Print => {
                    logger::info("Invoking Print Rune Inscription");
                    tab_manager.print_page();
                }
                IpcCommand::FindInPage { payload } => {
                    logger::info(&format!("Seeking rune in page: {} (case={}, regex={})", payload.query, payload.case_sensitive, payload.use_regex));
                    tab_manager.find_in_page(&payload.query, payload.case_sensitive, payload.use_regex);
                }
                IpcCommand::FindNext => {
                    logger::info("Seeking next rune match");
                    tab_manager.find_next();
                }
                IpcCommand::FindPrevious => {
                    logger::info("Seeking previous rune match");
                    tab_manager.find_previous();
                }
                IpcCommand::FindClose => {
                    logger::info("Closing rune search");
                    tab_manager.find_close();
                }
                IpcCommand::DuplicateTab { payload } => {
                    logger::info(&format!("Duplicating tab {} as {}", payload.tab_id, payload.new_tab_id));
                    tab_manager.duplicate_tab(&window_clone, &payload.tab_id, payload.new_tab_id);
                }
                IpcCommand::OpenPath { payload } => {
                    logger::info(&format!("Opening path: {} (is_dir={})", payload.path, payload.is_dir));
                    let path = payload.path;
                    if payload.is_dir {
                        let _ = std::process::Command::new("explorer")
                            .arg(format!("/select,{}", path))
                            .spawn();
                    } else {
                        let _ = std::process::Command::new("cmd")
                            .args(["/c", "start", "", &path])
                            .spawn();
                    }
                }
                IpcCommand::DeleteFile { payload } => {
                    logger::info(&format!("Deleting file from realm: {}", payload.path));
                    let p = std::path::Path::new(&payload.path);
                    if p.exists() {
                        let _ = std::fs::remove_file(p);
                    }
                }
                IpcCommand::DownloadUrl { payload } => {
                    logger::info(&format!("Initiating accelerated download for: {}", payload.url));
                    let proxy_dl = event_loop_proxy.clone();
                    let url = payload.url;
                    let mut filename = payload.filename.unwrap_or_default();
                    if filename.is_empty() {
                        filename = url
                            .split('/')
                            .last()
                            .unwrap_or("artifact.bin")
                            .split('?')
                            .next()
                            .unwrap_or("artifact.bin")
                            .to_string();
                    }
                    if filename.is_empty() {
                        filename = "artifact.bin".to_string();
                    }

                    let download_dir = if let Ok(userprofile) = std::env::var("USERPROFILE") {
                        let p = std::path::PathBuf::from(userprofile).join("Downloads");
                        if p.exists() {
                            p
                        } else {
                            std::env::temp_dir()
                        }
                    } else {
                        std::env::temp_dir()
                    };

                    let dest_path = download_dir.join(&filename);
                    let dest_str = dest_path.to_string_lossy().to_string();
                    let id = format!(
                        "dl-{}",
                        std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_millis()
                    );

                    let cancel_flag = download_mgr.register_cancel(&id);

                    let _ = proxy_dl.send_event(IpcCommand::DownloadStarted {
                        payload: crate::ipc::DownloadStartedPayload {
                            id: id.clone(),
                            filename,
                            url: url.clone(),
                            path: dest_str,
                        },
                    });

                    let proxy_opt = download_mgr.get_proxy();
                    let rt_handle = rt.clone();
                    rt_handle.spawn(async move {
                        accelerator::start_accelerated_download(id, url, dest_path, proxy_dl, cancel_flag, proxy_opt).await;
                    });
                }
                IpcCommand::ShowDevtools => {
                    logger::info("Opening devtools on active thread");
                    tab_manager.open_devtools();
                }
                IpcCommand::ExecuteScript { payload } => {
                    tab_manager.execute_script_on_active(&payload.script);
                }
                IpcCommand::DownloadStarted { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnDownloadStarted && window.__mimirOnDownloadStarted({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::DownloadProgress { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnDownloadProgress && window.__mimirOnDownloadProgress({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::DownloadCompleted { payload } => {
                    if let Some(id) = &payload.id {
                        download_mgr.cleanup(id);
                    }
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnDownloadCompleted && window.__mimirOnDownloadCompleted({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::ContextMenu { payload } => {
                    let bounds = tab_manager.get_effective_bounds();
                    let mut adjusted = payload;
                    adjusted.x += bounds.x;
                    adjusted.y += bounds.y;
                    if let Ok(json) = serde_json::to_string(&adjusted) {
                        let script = format!("window.__mimirOnContextMenu && window.__mimirOnContextMenu({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::CancelDownload { payload } => {
                    logger::info(&format!("Canceling download artifact {}", payload.id));
                    download_mgr.cancel(&payload.id);
                }
                IpcCommand::ConfigureProxy { payload } => {
                    tab_manager.configure_proxy(&payload.realm, &payload.mode, &payload.proxy_url, payload.enabled);
                    if payload.enabled && !payload.proxy_url.is_empty() && payload.mode != "direct" {
                        download_mgr.set_proxy(Some(payload.proxy_url.clone()));
                    } else {
                        download_mgr.set_proxy(None);
                    }
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnProxyConfigured && window.__mimirOnProxyConfigured({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::CalculateHash { payload } => {
                    let path_clone = payload.path.clone();
                    let proxy_hash = event_loop_proxy.clone();
                    std::thread::spawn(move || {
                        #[cfg(target_os = "windows")]
                        {
                            use std::os::windows::process::CommandExt;
                            const CREATE_NO_WINDOW: u32 = 0x08000000;
                            let output = std::process::Command::new("certutil")
                                .args(["-hashfile", &path_clone, "SHA256"])
                                .creation_flags(CREATE_NO_WINDOW)
                                .output();
                            if let Ok(out) = output {
                                let stdout = String::from_utf8_lossy(&out.stdout);
                                let lines: Vec<&str> = stdout.lines().collect();
                                let hash_str = if lines.len() >= 2 {
                                    lines[1].trim().to_string()
                                } else {
                                    "Error computing SHA-256".to_string()
                                };
                                let _ = proxy_hash.send_event(IpcCommand::HashResult {
                                    payload: crate::ipc::HashResultPayload {
                                        path: path_clone,
                                        hash: hash_str,
                                    },
                                });
                            }
                        }
                    });
                }
                IpcCommand::TrackerBlocked { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnTrackerBlocked && window.__mimirOnTrackerBlocked({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::FindResult { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnFindResult && window.__mimirOnFindResult({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::HashResult { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnHashResult && window.__mimirOnHashResult({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::AddTorrent { payload } => {
                    if let Some(mgr) = torrent_mgr.as_ref() {
                        let mgr_clone = mgr.clone();
                        let url_or_magnet = payload.url_or_magnet;
                        let custom_dir = payload.download_dir;
                        rt.spawn(async move {
                            if let Err(e) = mgr_clone.add_torrent(&url_or_magnet, custom_dir).await {
                                logger::error(&format!("Failed to add torrent to Naglfar Swarm: {}", e));
                            }
                        });
                    }
                }
                IpcCommand::PauseTorrent { payload } => {
                    if let Some(mgr) = torrent_mgr.as_ref() {
                        let mgr_clone = mgr.clone();
                        let id = payload.id;
                        rt.spawn(async move {
                            if let Err(e) = mgr_clone.pause_torrent(&id).await {
                                logger::error(&format!("Failed to pause torrent {}: {}", id, e));
                            }
                        });
                    }
                }
                IpcCommand::ResumeTorrent { payload } => {
                    if let Some(mgr) = torrent_mgr.as_ref() {
                        let mgr_clone = mgr.clone();
                        let id = payload.id;
                        rt.spawn(async move {
                            if let Err(e) = mgr_clone.resume_torrent(&id).await {
                                logger::error(&format!("Failed to resume torrent {}: {}", id, e));
                            }
                        });
                    }
                }
                IpcCommand::DeleteTorrent { payload } => {
                    if let Some(mgr) = torrent_mgr.as_ref() {
                        let mgr_clone = mgr.clone();
                        let id = payload.id;
                        let delete_files = payload.delete_files;
                        rt.spawn(async move {
                            if let Err(e) = mgr_clone.delete_torrent(&id, delete_files).await {
                                logger::error(&format!("Failed to delete torrent {}: {}", id, e));
                            }
                        });
                    }
                }
                IpcCommand::TorrentAdded { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnTorrentAdded && window.__mimirOnTorrentAdded({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::TorrentProgress { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnTorrentProgress && window.__mimirOnTorrentProgress({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::TorrentCompleted { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnTorrentCompleted && window.__mimirOnTorrentCompleted({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::ClearBrowsingData { payload } => {
                    tab_manager.clear_browsing_data(&payload);
                    let _ = _hud.evaluate_script("window.__mimirOnBrowsingDataCleared && window.__mimirOnBrowsingDataCleared({ success: true });");
                }
                IpcCommand::BrowsingDataCleared { success } => {
                    let script = format!("window.__mimirOnBrowsingDataCleared && window.__mimirOnBrowsingDataCleared({{ success: {} }});", success);
                    let _ = _hud.evaluate_script(&script);
                }
                IpcCommand::ExtractPageContent => {
                    tab_manager.extract_active_page_content();
                }
                IpcCommand::PageContent { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnPageContent && window.__mimirOnPageContent({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::ProxyConfigured { payload } => {
                    if let Ok(json) = serde_json::to_string(&payload) {
                        let script = format!("window.__mimirOnProxyConfigured && window.__mimirOnProxyConfigured({});", json);
                        let _ = _hud.evaluate_script(&script);
                    }
                }
                IpcCommand::SpawnPipWindow { payload } => {
                    logger::info(&format!("Spawning Sovereign OS-Level Always-On-Top PiP Window: {}", payload.title));
                    if let Some(win) = &pip_window {
                        win.set_focus();
                    } else {
                        let w = payload.width.unwrap_or(480.0);
                        let h = payload.height.unwrap_or(270.0);
                        let title = format!("ᛊ Mímir Floating Rune — {}", payload.title);
                        let icon_bytes = include_bytes!("../icon_64.rgba");
                        let win_icon = Icon::from_rgba(icon_bytes.to_vec(), 64, 64).ok();

                        let mut b = WindowBuilder::new()
                            .with_title(&title)
                            .with_window_icon(win_icon)
                            .with_inner_size(LogicalSize::new(w, h))
                            .with_min_inner_size(LogicalSize::new(280.0, 158.0))
                            .with_always_on_top(true)
                            .with_decorations(false)
                            .with_resizable(true);

                        if let (Some(x), Some(y)) = (payload.x, payload.y) {
                            b = b.with_position(tao::dpi::LogicalPosition::new(x, y));
                        }

                        if let Ok(new_win) = b.build(event_loop_target) {
                            let new_win_arc = Arc::new(new_win);
                            let proxy_for_pip = event_loop_proxy.clone();
                            let title_clone = payload.title.clone();

                            let pip_html = format!(r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Floating Rune PiP</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; user-select: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        body {{ background: #05070a; color: #fff; width: 100vw; height: 100vh; overflow: hidden; display: flex; flex-direction: column; border: 1px solid rgba(0, 245, 255, 0.4); border-radius: 12px; }}
        .header {{ height: 32px; background: rgba(10, 15, 26, 0.95); display: flex; align-items: center; justify-content: space-between; padding: 0 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); cursor: grab; }}
        .header:active {{ cursor: grabbing; }}
        .title-badge {{ font-size: 10px; font-weight: bold; color: #00f5ff; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }}
        .badge-aot {{ background: rgba(0, 245, 255, 0.2); border: 1px solid rgba(0, 245, 255, 0.4); padding: 1px 5px; border-radius: 4px; font-size: 8px; }}
        .btn-group {{ display: flex; align-items: center; gap: 6px; }}
        .btn {{ background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }}
        .btn:hover {{ color: #fff; background: rgba(255, 255, 255, 0.1); }}
        .btn.close:hover {{ color: #fb7185; background: rgba(244, 63, 94, 0.2); }}
        .screen {{ flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%); position: relative; }}
        .rune-disc {{ width: 56px; height: 56px; border-radius: 50%; border: 1px solid rgba(0, 245, 255, 0.4); background: rgba(0, 245, 255, 0.05); display: flex; align-items: center; justify-content: center; font-size: 24px; color: #00f5ff; box-shadow: 0 0 20px rgba(0, 245, 255, 0.2); animation: spin 8s linear infinite; }}
        @keyframes spin {{ 100% {{ transform: rotate(360deg); }} }}
        .track-title {{ margin-top: 10px; font-size: 11px; font-weight: 600; color: #e2e8f0; max-width: 80%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
        .controls {{ height: 42px; background: rgba(5, 7, 10, 0.9); border-top: 1px solid rgba(255, 255, 255, 0.06); display: flex; align-items: center; justify-content: center; gap: 16px; }}
        .ctrl-btn {{ background: none; border: none; color: #cbd5e1; cursor: pointer; font-size: 14px; padding: 6px; border-radius: 6px; }}
        .ctrl-btn:hover {{ color: #00f5ff; background: rgba(0, 245, 255, 0.1); }}
        .ctrl-btn.play {{ width: 32px; height: 32px; border-radius: 50%; background: #00f5ff; color: #05070a; font-weight: bold; display: flex; align-items: center; justify-content: center; }}
        .ctrl-btn.play:hover {{ background: #38bdf8; }}
    </style>
</head>
<body>
    <div class="header" id="drag-bar">
        <div class="title-badge">
            <span>ᛊ FLOATING RUNE</span>
            <span class="badge-aot">ALWAYS ON TOP</span>
        </div>
        <div class="btn-group">
            <button class="btn" id="dock-btn" title="Dock into Browser">⚓</button>
            <button class="btn close" id="close-btn" title="Close PiP">✕</button>
        </div>
    </div>
    <div class="screen">
        <div class="rune-disc">ᛊ</div>
        <div class="track-title" id="track-name">{}</div>
    </div>
    <div class="controls">
        <button class="ctrl-btn" id="seek-back" title="Rewind 10s">⏪</button>
        <button class="ctrl-btn play" id="play-btn" title="Play/Pause">▶</button>
        <button class="ctrl-btn" id="seek-fwd" title="Forward 10s">⏩</button>
    </div>
    <script>
        const post = (msg) => {{
            if (window.ipc && window.ipc.postMessage) window.ipc.postMessage(JSON.stringify(msg));
            else if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) window.chrome.webview.postMessage(JSON.stringify(msg));
        }};
        document.getElementById('drag-bar').addEventListener('mousedown', (e) => {{
            if (e.target.closest('button')) return;
            post({{ type: 'DRAG_PIP_WINDOW' }});
        }});
        document.getElementById('dock-btn').addEventListener('click', () => {{
            post({{ type: 'CLOSE_PIP_WINDOW' }});
        }});
        document.getElementById('close-btn').addEventListener('click', () => {{
            post({{ type: 'CLOSE_PIP_WINDOW' }});
        }});
        let isPlaying = {};
        const playBtn = document.getElementById('play-btn');
        playBtn.innerText = isPlaying ? '⏸' : '▶';
        playBtn.addEventListener('click', () => {{
            isPlaying = !isPlaying;
            playBtn.innerText = isPlaying ? '⏸' : '▶';
            post({{ type: 'EXECUTE_SCRIPT', payload: {{ tab_id: null, script: "var v = document.querySelector('video, audio'); if(v) {{ if(v.paused) v.play(); else v.pause(); }}" }} }});
        }});
        document.getElementById('seek-back').addEventListener('click', () => {{
            post({{ type: 'EXECUTE_SCRIPT', payload: {{ tab_id: null, script: "var v = document.querySelector('video, audio'); if(v) v.currentTime = Math.max(0, v.currentTime - 10);" }} }});
        }});
        document.getElementById('seek-fwd').addEventListener('click', () => {{
            post({{ type: 'EXECUTE_SCRIPT', payload: {{ tab_id: null, script: "var v = document.querySelector('video, audio'); if(v) v.currentTime = Math.min(v.duration || 999999, v.currentTime + 10);" }} }});
        }});
    </script>
</body>
</html>"#, title_clone, payload.is_playing);

                            let pip_wv_builder = WebViewBuilder::new()
                                .with_html(&pip_html)
                                .with_background_color((5, 7, 10, 255))
                                .with_ipc_handler(move |req: wry::http::Request<String>| {
                                    let msg = req.body();
                                    if let Ok(cmd) = serde_json::from_str::<IpcCommand>(msg) {
                                        let _ = proxy_for_pip.send_event(cmd);
                                    }
                                });

                            if let Ok(wv) = pip_wv_builder.build(&new_win_arc) {
                                pip_webview = Some(wv);
                                pip_window = Some(new_win_arc);
                                let _ = _hud.evaluate_script("window.__mimirOnPipWindowSpawned && window.__mimirOnPipWindowSpawned({ active: true });");
                            }
                        }
                    }
                }
                IpcCommand::ClosePipWindow => {
                    logger::info("Closing Sovereign Always-On-Top PiP Window");
                    pip_webview = None;
                    pip_window = None;
                    let _ = _hud.evaluate_script("window.__mimirOnPipWindowClosed && window.__mimirOnPipWindowClosed({ active: false });");
                }
                IpcCommand::DragPipWindow => {
                    if let Some(win) = &pip_window {
                        let _ = win.drag_window();
                    }
                }
                IpcCommand::SyncPipState { payload } => {
                    if let Some(wv) = &pip_webview {
                        let script = format!(
                            "if (document.getElementById('track-name') && '{}' !== '') document.getElementById('track-name').innerText = '{}'; if (document.getElementById('play-btn')) document.getElementById('play-btn').innerText = {} ? '⏸' : '▶';",
                            payload.title.as_deref().unwrap_or(""),
                            payload.title.as_deref().unwrap_or(""),
                            payload.is_playing
                        );
                        let _ = wv.evaluate_script(&script);
                    }
                }
            },
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                logger::info("Window close requested. Exiting event loop.");
                *control_flow = ControlFlow::Exit;
                std::process::exit(0);
            }
            _ => (),
        }
    });
}
