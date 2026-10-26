#![windows_subsystem = "windows"]

use std::fs::File;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::thread;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

use serde::{Deserialize, Serialize};
use tao::dpi::LogicalSize;
use tao::event::{Event, WindowEvent};
use tao::event_loop::{ControlFlow, EventLoop, EventLoopBuilder, EventLoopProxy};
use tao::window::WindowBuilder;
use wry::WebViewBuilder;

// Embedded payload zip (populated during release compilation)
static EMBEDDED_PAYLOAD: &[u8] = include_bytes!("../../payload.zip");

// Event loop bridge event
#[derive(Debug)]
enum UserEvent {
    Ipc(String),
    Minimize,
    Close,
    Drag,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
enum InboundMessage {
    #[serde(rename = "DOM_READY")]
    DomReady,
    #[serde(rename = "DRAG_WINDOW")]
    DragWindow,
    #[serde(rename = "MINIMIZE_WINDOW")]
    MinimizeWindow,
    #[serde(rename = "CLOSE_WINDOW")]
    CloseWindow,
    #[serde(rename = "CHECK_DISK_SPACE")]
    CheckDiskSpace { path: String },
    #[serde(rename = "BROWSE_FOLDER")]
    BrowseFolder {
        #[serde(rename = "initialPath")]
        initial_path: String,
    },
    #[serde(rename = "START_INSTALL")]
    StartInstall {
        #[serde(rename = "installPath")]
        install_path: String,
        #[serde(rename = "installShortcuts")]
        install_shortcuts: bool,
        #[serde(rename = "installVideoPack")]
        install_video_pack: bool,
    },
    #[serde(rename = "FINISH_SETUP")]
    FinishSetup { launch: bool },
}

#[allow(dead_code)]
#[derive(Serialize, Debug)]
#[serde(tag = "type")]
enum OutboundMessage {
    #[serde(rename = "INITIAL_STATE")]
    InitialState {
        #[serde(rename = "defaultPath")]
        default_path: String,
        #[serde(rename = "driveLetter")]
        drive_letter: String,
        #[serde(rename = "freeBytes")]
        free_bytes: u64,
        #[serde(rename = "totalBytes")]
        total_bytes: u64,
    },
    #[serde(rename = "DISK_SPACE_UPDATE")]
    DiskSpaceUpdate {
        #[serde(rename = "driveLetter")]
        drive_letter: String,
        #[serde(rename = "freeBytes")]
        free_bytes: u64,
        #[serde(rename = "totalBytes")]
        total_bytes: u64,
    },
    #[serde(rename = "PATH_SELECTED")]
    PathSelected { path: String },
    #[serde(rename = "PROGRESS")]
    Progress {
        percent: u32,
        phase: String,
        detail: String,
    },
    #[serde(rename = "COMPLETE")]
    Complete,
    #[serde(rename = "ERROR")]
    Error { error: String },
}

fn query_disk_space(path_str: &str) -> (String, u64, u64) {
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::Storage::FileSystem::GetDiskFreeSpaceExW;

    let drive_letter = if let Some(idx) = path_str.find(':') {
        let drive = &path_str[..idx];
        format!("{}:", drive.to_uppercase())
    } else {
        "C:".to_string()
    };

    let root_path = format!("{}\\", drive_letter);
    let wide: Vec<u16> = std::ffi::OsStr::new(&root_path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let mut free_available: u64 = 0;
    let mut total: u64 = 0;
    let mut total_free: u64 = 0;

    let success = unsafe {
        GetDiskFreeSpaceExW(
            PCWSTR(wide.as_ptr()),
            Some(&mut free_available),
            Some(&mut total),
            Some(&mut total_free),
        )
        .is_ok()
    };

    if success {
        (drive_letter, free_available, total)
    } else {
        (drive_letter, 0, 0)
    }
}

fn get_default_install_dir() -> String {
    if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
        format!("{}\\Programs\\Mimir", local_app_data)
    } else {
        "C:\\Program Files\\Mimir".to_string()
    }
}

fn browse_for_folder(initial: &str) -> Option<String> {
    let script = format!(
        "[System.Reflection.Assembly]::LoadWithPartialName('System.windows.forms') | Out-Null; \
         $f = New-Object System.Windows.Forms.FolderBrowserDialog; \
         $f.SelectedPath = '{}'; \
         $f.Description = 'Select Mímir Browser Installation Sanctuary'; \
         if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {{ Write-Host $f.SelectedPath }}",
        initial.replace('\'', "''")
    );

    let mut cmd = std::process::Command::new("powershell");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let output = cmd
        .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &script])
        .output()
        .ok()?;

    let res = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if !res.is_empty() {
        Some(res)
    } else {
        None
    }
}

fn create_shortcut(
    target_exe: &str,
    shortcut_path: &str,
    description: &str,
    icon_path: &str,
) -> std::io::Result<()> {
    if let Some(parent) = Path::new(shortcut_path).parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let work_dir = Path::new(target_exe)
        .parent()
        .unwrap_or(Path::new(""))
        .to_string_lossy();

    let script = format!(
        "$s = (New-Object -COM WScript.Shell).CreateShortcut('{}'); \
         $s.TargetPath = '{}'; \
         $s.WorkingDirectory = '{}'; \
         $s.Description = '{}'; \
         $s.IconLocation = '{},0'; \
         $s.Save()",
        shortcut_path.replace('\'', "''"),
        target_exe.replace('\'', "''"),
        work_dir.replace('\'', "''"),
        description.replace('\'', "''"),
        icon_path.replace('\'', "''")
    );

    let mut cmd = std::process::Command::new("powershell");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let _ = cmd
        .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &script])
        .output();
    Ok(())
}

fn register_uninstaller(install_dir: &str, display_version: &str) {
    let uninst_exe = format!("{}\\uninstall.exe", install_dir);
    let ico_path = format!("{}\\mimir.ico", install_dir);
    let script = format!(
        "$key = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Mimir'; \
         New-Item -Path $key -Force | Out-Null; \
         Set-ItemProperty -Path $key -Name 'DisplayName' -Value 'Mímir Browser' -Force; \
         Set-ItemProperty -Path $key -Name 'DisplayVersion' -Value '{}' -Force; \
         Set-ItemProperty -Path $key -Name 'Publisher' -Value 'indoctrinatedrecluse' -Force; \
         Set-ItemProperty -Path $key -Name 'InstallLocation' -Value '{}' -Force; \
         Set-ItemProperty -Path $key -Name 'UninstallString' -Value '\"{}\" --uninstall' -Force; \
         Set-ItemProperty -Path $key -Name 'DisplayIcon' -Value '{},0' -Force; \
         Set-ItemProperty -Path $key -Name 'URLInfoAbout' -Value 'https://github.com/indoctrinatedrecluse/Mimir' -Force",
        display_version,
        install_dir.replace('\'', "''"),
        uninst_exe.replace('\'', "''"),
        ico_path.replace('\'', "''")
    );

    let mut cmd = std::process::Command::new("powershell");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let _ = cmd
        .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", &script])
        .output();
}

fn run_uninstall() {
    let script = r#"
        Add-Type -AssemblyName System.Windows.Forms
        $ans = [System.Windows.Forms.MessageBox]::Show(
            'Are you sure you wish to dismantle the Mímir Sanctuary from your system?',
            'Mímir Browser Uninstallation',
            [System.Windows.Forms.MessageBoxButtons]::YesNo,
            [System.Windows.Forms.MessageBoxIcon]::Question
        );
        if ($ans -eq [System.Windows.Forms.DialogResult]::Yes) {
            Remove-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Mimir' -Recurse -ErrorAction SilentlyContinue;

            $desk = [Environment]::GetFolderPath('Desktop');
            $start = [Environment]::GetFolderPath('Programs');
            Remove-Item -Path "$desk\Mimir.lnk" -Force -ErrorAction SilentlyContinue;
            Remove-Item -Path "$start\Mimir.lnk" -Force -ErrorAction SilentlyContinue;

            $appDir = Split-Path -Parent $MyInvocation.MyCommand.Path;
            Start-Process cmd.exe -ArgumentList "/c timeout /t 2 & rmdir /s /q `"$appDir`"" -WindowStyle Hidden;

            [System.Windows.Forms.MessageBox]::Show(
                'Mímir Browser has been cleanly uninstalled from your machine.',
                'Uninstallation Complete',
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Information
            );
        }
    "#;
    let mut cmd = std::process::Command::new("powershell");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let _ = cmd
        .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", script])
        .status();
}

fn extract_zip_bytes<R: std::io::Read + std::io::Seek>(
    reader: R,
    dest_dir: &Path,
    proxy: &EventLoopProxy<UserEvent>,
    start_pct: u32,
    end_pct: u32,
    phase: &str,
) -> Result<(), String> {
    let mut archive = zip::ZipArchive::new(reader).map_err(|e| e.to_string())?;
    let total_files = archive.len();

    for i in 0..total_files {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = match file.enclosed_name() {
            Some(path) => dest_dir.join(path),
            None => continue,
        };

        if (*file.name()).ends_with('/') {
            let _ = std::fs::create_dir_all(&outpath);
        } else {
            if let Some(p) = outpath.parent() {
                let _ = std::fs::create_dir_all(p);
            }
            let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }

        if total_files > 0 {
            let pct = start_pct + ((i as u32 * (end_pct - start_pct)) / total_files as u32);
            let filename = outpath
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();
            send_progress(proxy, pct, phase, &filename);
        }
    }
    Ok(())
}

fn send_progress(proxy: &EventLoopProxy<UserEvent>, percent: u32, phase: &str, detail: &str) {
    let msg = OutboundMessage::Progress {
        percent,
        phase: phase.to_string(),
        detail: detail.to_string(),
    };
    if let Ok(json) = serde_json::to_string(&msg) {
        let _ = proxy.send_event(UserEvent::Ipc(json));
    }
}

fn find_portable_zip() -> Option<PathBuf> {
    let cur = std::env::current_dir().ok()?;
    let candidates = [
        cur.join("mimir-portable.zip"),
        cur.join("mimir-v0.9.0-windows-x64-portable.zip"),
        cur.join("mimir-v0.8.0-windows-x64-portable.zip"),
        cur.join("mimir-v0.7.0-windows-x64-portable.zip"),
        cur.parent()
            .map(|p| p.join("mimir-v0.9.0-windows-x64-portable.zip"))
            .unwrap_or_default(),
        cur.parent()
            .map(|p| p.join("mimir-v0.8.0-windows-x64-portable.zip"))
            .unwrap_or_default(),
    ];
    for c in &candidates {
        if c.exists() {
            return Some(c.clone());
        }
    }
    None
}

async fn download_video_pack(
    video_dir: &Path,
    proxy: EventLoopProxy<UserEvent>,
) -> Result<(), String> {
    let url = "https://github.com/indoctrinatedrecluse/Mimir/releases/latest/download/mimir-cinematic-realm-pack.zip";
    send_progress(
        &proxy,
        50,
        "Downloading Living Cinematic Realm Pack...",
        "Connecting to GitHub Releases...",
    );

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("Server returned HTTP {}", res.status()));
    }

    let temp_zip = std::env::temp_dir().join("mimir-cinematic-realm-pack.zip");
    let mut file = File::create(&temp_zip).map_err(|e| e.to_string())?;

    let total_size = res.content_length().unwrap_or(92_842_357);
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();
    use futures::StreamExt;

    while let Some(chunk_res) = stream.next().await {
        let chunk = chunk_res.map_err(|e| e.to_string())?;
        std::io::Write::write_all(&mut file, &chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        let pct = 50 + (((downloaded as f64 / total_size as f64) * 35.0) as u32);
        let detail = format!(
            "{:.1} MB / {:.1} MB",
            downloaded as f64 / 1_048_576.0,
            total_size as f64 / 1_048_576.0
        );
        send_progress(
            &proxy,
            pct,
            "Downloading Living Cinematic Realm Pack...",
            &detail,
        );
    }

    send_progress(
        &proxy,
        86,
        "Extracting Living Cinematic Videos...",
        "Unpacking 9 sovereign loops...",
    );

    let file_read = File::open(&temp_zip).map_err(|e| e.to_string())?;
    extract_zip_bytes(
        file_read,
        video_dir,
        &proxy,
        86,
        94,
        "Unpacking Living Videos...",
    )?;
    let _ = std::fs::remove_file(&temp_zip);
    Ok(())
}

fn execute_installation(
    install_path: String,
    install_shortcuts: bool,
    install_video_pack: bool,
    proxy: EventLoopProxy<UserEvent>,
) {
    let dest_dir = PathBuf::from(&install_path);
    let _ = std::fs::create_dir_all(&dest_dir);

    send_progress(
        &proxy,
        5,
        "Forging Sanctuary Foundations...",
        "Creating install directory...",
    );

    // 1. Extract Core Binaries
    if EMBEDDED_PAYLOAD.len() > 10_000 {
        let cursor = Cursor::new(EMBEDDED_PAYLOAD);
        if let Err(e) = extract_zip_bytes(
            cursor,
            &dest_dir,
            &proxy,
            10,
            48,
            "Extracting core sanctuary...",
        ) {
            eprintln!("Payload extract warning: {}", e);
        }
    } else if let Some(local_zip) = find_portable_zip() {
        if let Ok(f) = File::open(&local_zip) {
            let _ = extract_zip_bytes(
                f,
                &dest_dir,
                &proxy,
                10,
                48,
                "Extracting local portable archive...",
            );
        }
    } else {
        // Fallback for dev mode: copy binaries from current directory
        let exe_src = Path::new("src-rust/target/release/mimir-core.exe");
        if exe_src.exists() {
            let _ = std::fs::copy(exe_src, dest_dir.join("mimir.exe"));
        }
        let ico_src = Path::new("mimir.ico");
        if ico_src.exists() {
            let _ = std::fs::copy(ico_src, dest_dir.join("mimir.ico"));
        }
    }

    // 2. Video Pack (if selected)
    if install_video_pack {
        let video_dir = dest_dir.join("dist").join("realms").join("videos");
        let _ = std::fs::create_dir_all(&video_dir);

        let local_pack = Path::new("mimir-cinematic-realm-pack.zip");
        if local_pack.exists() {
            send_progress(
                &proxy,
                55,
                "Extracting Living Cinematic Realm Pack...",
                "Found local zip package",
            );
            if let Ok(f) = File::open(local_pack) {
                let _ = extract_zip_bytes(
                    f,
                    &video_dir,
                    &proxy,
                    55,
                    90,
                    "Unpacking Living Videos...",
                );
            }
        } else {
            let proxy_clone = proxy.clone();
            let video_dir_clone = video_dir.clone();
            let rt = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build();
            if let Ok(runtime) = rt {
                if let Err(e) = runtime.block_on(download_video_pack(&video_dir_clone, proxy_clone))
                {
                    eprintln!("Video pack download error (falling back to Option A): {}", e);
                }
            }
        }
    }

    // 3. Shortcuts (if selected)
    if install_shortcuts {
        send_progress(
            &proxy,
            95,
            "Inscribing System Shortcuts...",
            "Creating Desktop and Start Menu links...",
        );

        let target_exe = dest_dir.join("mimir.exe").to_string_lossy().to_string();
        let icon_path = dest_dir.join("mimir.ico").to_string_lossy().to_string();

        if let Ok(userprofile) = std::env::var("USERPROFILE") {
            let desk_lnk = format!("{}\\Desktop\\Mimir.lnk", userprofile);
            let _ = create_shortcut(
                &target_exe,
                &desk_lnk,
                "Mímir Browser - Gateway to the Nine Realms",
                &icon_path,
            );
        }

        if let Ok(appdata) = std::env::var("APPDATA") {
            let start_lnk = format!(
                "{}\\Microsoft\\Windows\\Start Menu\\Programs\\Mimir.lnk",
                appdata
            );
            let _ = create_shortcut(
                &target_exe,
                &start_lnk,
                "Mímir Browser - Gateway to the Nine Realms",
                &icon_path,
            );
        }
    }

    // 4. Register in Windows Add/Remove Programs
    send_progress(
        &proxy,
        98,
        "Consecrating System Registry...",
        "Registering uninstaller...",
    );
    register_uninstaller(&install_path, "0.9.0");

    // Copy installer as uninstaller
    if let Ok(current_exe) = std::env::current_exe() {
        let _ = std::fs::copy(&current_exe, dest_dir.join("uninstall.exe"));
    }

    send_progress(
        &proxy,
        100,
        "Sanctum Fully Consecrated!",
        "All components initialized.",
    );
    let _ = proxy.send_event(UserEvent::Ipc(
        serde_json::to_string(&OutboundMessage::Complete).unwrap(),
    ));
}

fn main() {
    // Check if uninstallation flag is passed
    if std::env::args().any(|a| a == "--uninstall") {
        run_uninstall();
        return;
    }

    let event_loop: EventLoop<UserEvent> = EventLoopBuilder::with_user_event().build();
    let proxy = event_loop.create_proxy();

    let window = WindowBuilder::new()
        .with_title("Mímir Sanctum Setup")
        .with_inner_size(LogicalSize::new(820.0, 560.0))
        .with_resizable(false)
        .with_decorations(false)
        .with_transparent(true)
        .build(&event_loop)
        .expect("Failed to create installer window");

    // Load installer HTML
    let html_content = include_str!("installer_ui.html");

    let proxy_ipc = proxy.clone();
    let webview = WebViewBuilder::new()
        .with_html(html_content)
        .with_ipc_handler(move |request| {
            let msg = request.body();
            if let Ok(inbound) = serde_json::from_str::<InboundMessage>(msg) {
                match inbound {
                    InboundMessage::DomReady => {
                        let default_dir = get_default_install_dir();
                        let (drive, free, total) = query_disk_space(&default_dir);
                        let out = OutboundMessage::InitialState {
                            default_path: default_dir,
                            drive_letter: drive,
                            free_bytes: free,
                            total_bytes: total,
                        };
                        if let Ok(json) = serde_json::to_string(&out) {
                            let _ = proxy_ipc.send_event(UserEvent::Ipc(json));
                        }
                    }
                    InboundMessage::DragWindow => {
                        let _ = proxy_ipc.send_event(UserEvent::Drag);
                    }
                    InboundMessage::MinimizeWindow => {
                        let _ = proxy_ipc.send_event(UserEvent::Minimize);
                    }
                    InboundMessage::CloseWindow => {
                        let _ = proxy_ipc.send_event(UserEvent::Close);
                    }
                    InboundMessage::CheckDiskSpace { path } => {
                        let (drive, free, total) = query_disk_space(&path);
                        let out = OutboundMessage::DiskSpaceUpdate {
                            drive_letter: drive,
                            free_bytes: free,
                            total_bytes: total,
                        };
                        if let Ok(json) = serde_json::to_string(&out) {
                            let _ = proxy_ipc.send_event(UserEvent::Ipc(json));
                        }
                    }
                    InboundMessage::BrowseFolder { initial_path } => {
                        if let Some(selected) = browse_for_folder(&initial_path) {
                            let out = OutboundMessage::PathSelected { path: selected };
                            if let Ok(json) = serde_json::to_string(&out) {
                                let _ = proxy_ipc.send_event(UserEvent::Ipc(json));
                            }
                        }
                    }
                    InboundMessage::StartInstall {
                        install_path,
                        install_shortcuts,
                        install_video_pack,
                    } => {
                        let p = proxy_ipc.clone();
                        thread::spawn(move || {
                            execute_installation(
                                install_path,
                                install_shortcuts,
                                install_video_pack,
                                p,
                            );
                        });
                    }
                    InboundMessage::FinishSetup { launch } => {
                        if launch {
                            let default_dir = get_default_install_dir();
                            let exe_path = format!("{}\\mimir.exe", default_dir);
                            let mut cmd = std::process::Command::new(exe_path);
                            #[cfg(target_os = "windows")]
                            cmd.creation_flags(CREATE_NO_WINDOW);
                            let _ = cmd.spawn();
                        }
                        let _ = proxy_ipc.send_event(UserEvent::Close);
                    }
                }
            }
        })
        .build(&window)
        .expect("Failed to initialize installer webview");

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                *control_flow = ControlFlow::Exit;
            }
            Event::UserEvent(user_event) => match user_event {
                UserEvent::Ipc(json) => {
                    let script = format!("window.onIpcMessage({});", json);
                    let _ = webview.evaluate_script(&script);
                }
                UserEvent::Drag => {
                    let _ = window.drag_window();
                }
                UserEvent::Minimize => {
                    window.set_minimized(true);
                }
                UserEvent::Close => {
                    *control_flow = ControlFlow::Exit;
                }
            },
            _ => (),
        }
    });
}
