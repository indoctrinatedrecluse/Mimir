#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(dead_code)]

mod ipc;
mod logger;
mod tab_manager;

use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tao::{
    dpi::LogicalSize,
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoop},
    window::WindowBuilder,
};
use wry::WebViewBuilder;
use ipc::IpcCommand;
use tab_manager::TabManager;

/// Resolves the URL for the HUD presentation layer.
/// Searches for built dist/index.html across common execution environments,
/// correctly formatting the path into an RFC 8089 compliant file URI for WebView2,
/// or falling back to local Vite dev server.
fn resolve_hud_url() -> String {
    // 1. Explicit dev environment flag
    if std::env::var("MIMIR_DEV").is_ok() {
        logger::info("MIMIR_DEV environment variable detected; channeling HUD from dev server: http://localhost:5173");
        return "http://localhost:5173".to_string();
    }

    // 2. Discover dist/index.html across common installation and workspace topologies
    let mut candidate_paths: Vec<PathBuf> = Vec::new();

    // Check relative to executable location (highest priority for installed & portable packages)
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            // Standard packaged structure: <install_dir>/mimir.exe -> <install_dir>/dist/index.html
            candidate_paths.push(exe_dir.join("dist").join("index.html"));
            // Cargo target inside subcrate: <repo>/src-rust/target/(release|debug)/mimir-core.exe -> <repo>/dist/index.html (3 levels up)
            candidate_paths.push(exe_dir.join("..").join("..").join("..").join("dist").join("index.html"));
            // Cargo target at repo root: <repo>/target/(release|debug)/mimir-core.exe -> <repo>/dist/index.html (2 levels up)
            candidate_paths.push(exe_dir.join("..").join("..").join("dist").join("index.html"));
            candidate_paths.push(exe_dir.join("..").join("dist").join("index.html"));
        }
    }

    // Check relative to current working directory
    if let Ok(cwd) = std::env::current_dir() {
        candidate_paths.push(cwd.join("dist").join("index.html"));
        candidate_paths.push(cwd.join("..").join("dist").join("index.html"));
        candidate_paths.push(cwd.join("..").join("..").join("dist").join("index.html"));
    }

    for path in candidate_paths {
        if path.exists() {
            let normalized_path = match path.canonicalize() {
                Ok(canon) => {
                    let canon_str = canon.to_string_lossy().to_string();
                    // On Windows, canonicalize() prepends '\\?\' which is invalid in Chromium file:// URIs
                    canon_str.strip_prefix(r"\\?\").unwrap_or(&canon_str).to_string()
                }
                Err(_) => path.to_string_lossy().to_string(),
            };

            // Format as a compliant file URI: file:///C:/path/to/dist/index.html
            let clean_path = normalized_path.replace('\\', "/");
            let file_url = if clean_path.starts_with('/') {
                format!("file://{}", clean_path)
            } else {
                format!("file:///{}", clean_path)
            };

            logger::info(&format!("Discovered sacred HUD sanctum on disk: {}", file_url));
            return file_url;
        }
    }

    // 3. Fallback to local dev server URL
    logger::warn("Could not find dist/index.html in any candidate location. Defaulting to http://localhost:5173");
    "http://localhost:5173".to_string()
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
        println!("Mímir Browser Core v0.1.0 (Runic Conduit)");
        return Ok(());
    }

    // Direct WebView2 data and cache away from the project workspace to prevent file lock
    // collisions with Vite's watcher
    if std::env::var("WEBVIEW2_USER_DATA_FOLDER").is_err() {
        let data_dir = std::env::temp_dir().join("mimir_webview2_data");
        logger::info(&format!("Setting WebView2 user data directory: {}", data_dir.display()));
        std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", data_dir);
    }

    let event_loop = EventLoop::new();

    // Create a modern borderless native window for the Mímir HUD
    let window = match WindowBuilder::new()
        .with_title("Mímir Browser — Runic Conduit")
        .with_inner_size(LogicalSize::new(1280.0, 800.0))
        .with_min_inner_size(LogicalSize::new(960.0, 600.0))
        .with_decorations(false) // Custom Norse HUD TitleBar handles window controls
        .build(&event_loop)
    {
        Ok(win) => Arc::new(win),
        Err(e) => {
            let err_msg = format!("Failed to create Mímir window frame: {}", e);
            logger::error(&err_msg);
            logger::show_native_error_dialog("Mímir Window Creation Error", &err_msg);
            return Err(e.into());
        }
    };

    let tab_manager = Arc::new(Mutex::new(TabManager::new()));
    let hud_url = resolve_hud_url();

    logger::info(&format!("Launching Runic Conduit with HUD: {}", hud_url));

    let window_clone = Arc::clone(&window);
    let tab_mgr_clone = Arc::clone(&tab_manager);

    // Build the primary HUD WebView
    let _hud_webview = match WebViewBuilder::new()
        .with_url(&hud_url)
        .with_ipc_handler(move |req: wry::http::Request<String>| {
            let msg = req.body();
            if let Ok(cmd) = serde_json::from_str::<IpcCommand>(msg) {
                match cmd {
                    IpcCommand::WindowMinimize => {
                        window_clone.set_minimized(true);
                    }
                    IpcCommand::WindowMaximize => {
                        let is_max = window_clone.is_maximized();
                        window_clone.set_maximized(!is_max);
                    }
                    IpcCommand::WindowClose => {
                        logger::info("WindowClose command received from HUD. Shutting down.");
                        std::process::exit(0);
                    }
                    IpcCommand::UpdateViewportBounds { payload } => {
                        if let Ok(mut mgr) = tab_mgr_clone.lock() {
                            mgr.update_bounds(payload);
                        }
                    }
                    IpcCommand::Navigate { payload } => {
                        logger::info(&format!("Commencing navigation across Bifröst: {}", payload.url));
                        if let Ok(mut mgr) = tab_mgr_clone.lock() {
                            mgr.navigate_active(&window_clone, &payload.url);
                        }
                    }
                    IpcCommand::CreateTab { payload } => {
                        logger::info(&format!("Growing new Yggdrasil branch in realm: {}", payload.realm));
                        if let Ok(mut mgr) = tab_mgr_clone.lock() {
                            let new_id = format!("tab-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
                            let url = payload.url.unwrap_or_else(|| "mimir://newtab".to_string());
                            mgr.open_or_navigate_tab(&window_clone, new_id, url, payload.realm);
                        }
                    }
                    IpcCommand::CloseTab { payload } => {
                        logger::info(&format!("Severing Yggdrasil thread: {}", payload.tab_id));
                        if let Ok(mut mgr) = tab_mgr_clone.lock() {
                            mgr.remove_tab(&payload.tab_id);
                        }
                    }
                    IpcCommand::SwitchTab { payload } => {
                        if let Ok(mut mgr) = tab_mgr_clone.lock() {
                            mgr.switch_tab(&payload.tab_id);
                        }
                    }
                    IpcCommand::GoBack => {
                        logger::info("Rewinding memory (Back)");
                    }
                    IpcCommand::GoForward => {
                        logger::info("Advancing vision (Forward)");
                    }
                    IpcCommand::Refresh => {
                        logger::info("Refreshing sacred spring (Reload)");
                    }
                }
            } else {
                logger::warn(&format!("Received unrecognized IPC rune: {}", msg));
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
            logger::show_native_error_dialog("Mímir Engine Initialization Error", &err_msg);
            return Err(e.into());
        }
    };

    logger::info("Mímir Runic Conduit event loop running.");

    // Run Tao event loop
    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                logger::info("Window close requested. Exiting event loop.");
                *control_flow = ControlFlow::Exit;
            }
            _ => (),
        }
    });
}
