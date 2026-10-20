#![allow(dead_code)]

mod ipc;
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

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let event_loop = EventLoop::new();

    // Create a modern borderless native window for the Mímir HUD
    let window = WindowBuilder::new()
        .with_title("Mímir Browser — Runic Conduit")
        .with_inner_size(LogicalSize::new(1280.0, 800.0))
        .with_min_inner_size(LogicalSize::new(960.0, 600.0))
        .with_decorations(false) // Custom Norse HUD TitleBar handles window controls
        .build(&event_loop)?;

    let window = Arc::new(window);
    let tab_manager = Arc::new(Mutex::new(TabManager::new()));

    // Locate the HUD frontend: check for local dev server or built dist folder
    let hud_url = if std::env::var("MIMIR_DEV").is_ok() {
        "http://localhost:5173".to_string()
    } else {
        // Find dist/index.html relative to executable or workspace
        let dev_dist = PathBuf::from("../dist/index.html");
        let local_dist = PathBuf::from("dist/index.html");
        if dev_dist.exists() {
            format!("file://{}", dev_dist.canonicalize()?.display())
        } else if local_dist.exists() {
            format!("file://{}", local_dist.canonicalize()?.display())
        } else {
            // Default to local dev server URL
            "http://localhost:5173".to_string()
        }
    };

    println!("[ᛗ MÍMIR] Launching Runic Conduit with HUD: {}", hud_url);

    let window_clone = Arc::clone(&window);
    let tab_mgr_clone = Arc::clone(&tab_manager);

    // Build the primary HUD WebView
    let _hud_webview = WebViewBuilder::new()
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
                        std::process::exit(0);
                    }
                    IpcCommand::UpdateViewportBounds { payload } => {
                        if let Ok(mut mgr) = tab_mgr_clone.lock() {
                            mgr.update_bounds(payload);
                        }
                    }
                    IpcCommand::Navigate { payload } => {
                        println!("[ᛗ MÍMIR] Commencing navigation across Bifröst: {}", payload.url);
                    }
                    IpcCommand::CreateTab { payload } => {
                        println!("[ᛗ MÍMIR] Growing new Yggdrasil branch in realm: {}", payload.realm);
                    }
                    IpcCommand::CloseTab { payload } => {
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
                        println!("[ᛗ MÍMIR] Rewinding memory (Back)");
                    }
                    IpcCommand::GoForward => {
                        println!("[ᛗ MÍMIR] Advancing vision (Forward)");
                    }
                    IpcCommand::Refresh => {
                        println!("[ᛗ MÍMIR] Refreshing sacred spring (Reload)");
                    }
                }
            } else {
                eprintln!("[ᛗ MÍMIR] Received unrecognized IPC rune: {}", msg);
            }
        })
        .build(&window)?;

    // Run Tao event loop
    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                *control_flow = ControlFlow::Exit;
            }
            _ => (),
        }
    });
}
