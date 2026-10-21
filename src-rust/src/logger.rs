use std::fs::{self, File, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

/// Maximum log file size in bytes (512 KB).
/// Easily discoverable by Windows Disk Cleanup in %TEMP% while strictly preventing disk bloat.
const MAX_LOG_SIZE_BYTES: u64 = 512 * 1024;
const TRUNCATE_RETAIN_BYTES: u64 = 256 * 1024;

static LOG_MUTEX: Mutex<()> = Mutex::new(());

/// Returns the path to the crash and diagnostic log in Windows Temp directory.
pub fn get_log_path() -> PathBuf {
    std::env::temp_dir().join("mimir_crash.log")
}

/// Formats current UTC timestamp as [YYYY-MM-DD HH:MM:SS.mmm]
fn current_timestamp() -> String {
    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap_or_default();
    let total_secs = duration.as_secs();
    let millis = duration.subsec_millis();

    let seconds_in_day = total_secs % 86400;
    let hours = seconds_in_day / 3600;
    let minutes = (seconds_in_day % 3600) / 60;
    let seconds = seconds_in_day % 60;

    let days = total_secs / 86400;
    let mut year = 1970;
    let mut day_count = days;
    loop {
        let leap = if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) {
            366
        } else {
            365
        };
        if day_count < leap {
            break;
        }
        day_count -= leap;
        year += 1;
    }

    let leap_year = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    let days_in_months = [
        31,
        if leap_year { 29 } else { 28 },
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];
    let mut month = 1;
    for &dim in &days_in_months {
        if day_count < dim {
            break;
        }
        day_count -= dim;
        month += 1;
    }
    let day = day_count + 1;

    format!(
        "{:04}-{:02}-{:02} {:02}:{:02}:{:02}.{:03}",
        year, month, day, hours, minutes, seconds, millis
    )
}

/// Appends a message to the crash log with strict size control.
pub fn log_entry(level: &str, message: &str) {
    let _guard = LOG_MUTEX.lock().unwrap();
    let log_path = get_log_path();

    let line = format!("[{}] [{}] [ᛗ MÍMIR] {}\n", current_timestamp(), level, message);

    // Also echo to console/stderr if available
    eprint!("{}", line);

    // Size control: if file exceeds MAX_LOG_SIZE_BYTES, retain the tail
    if let Ok(metadata) = fs::metadata(&log_path) {
        if metadata.len() > MAX_LOG_SIZE_BYTES {
            if let Ok(mut f) = File::open(&log_path) {
                let mut buffer = Vec::new();
                if f.seek(SeekFrom::End(-(TRUNCATE_RETAIN_BYTES as i64))).is_ok() {
                    let _ = f.read_to_end(&mut buffer);
                }
                drop(f);
                if let Ok(mut new_file) = File::create(&log_path) {
                    let _ = new_file.write_all(b"[... older logs truncated by \xe1\x9b\x97 M\xc3\xadmir log size manager ...]\n");
                    let _ = new_file.write_all(&buffer);
                }
            }
        }
    }

    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&log_path) {
        let _ = file.write_all(line.as_bytes());
    }
}

pub fn info(message: &str) {
    log_entry("INFO", message);
}

pub fn warn(message: &str) {
    log_entry("WARN", message);
}

pub fn error(message: &str) {
    log_entry("ERROR", message);
}

/// Displays a native Windows error message box.
#[cfg(target_os = "windows")]
pub fn show_native_error_dialog(title: &str, message: &str) {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};

    let title_wide: Vec<u16> = OsStr::new(title).encode_wide().chain(std::iter::once(0)).collect();
    let msg_wide: Vec<u16> = OsStr::new(message).encode_wide().chain(std::iter::once(0)).collect();

    unsafe {
        MessageBoxW(
            None,
            PCWSTR::from_raw(msg_wide.as_ptr()),
            PCWSTR::from_raw(title_wide.as_ptr()),
            MB_OK | MB_ICONERROR,
        );
    }
}

#[cfg(not(target_os = "windows"))]
pub fn show_native_error_dialog(title: &str, message: &str) {
    eprintln!("[ERROR DIALOG] {}: {}", title, message);
}

/// Displays a native Windows Yes/No dialog. Returns true if user clicked Yes.
#[cfg(target_os = "windows")]
pub fn ask_yes_no_dialog(title: &str, message: &str) -> bool {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows::core::PCWSTR;
    use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONQUESTION, MB_YESNO, IDYES};

    let title_wide: Vec<u16> = OsStr::new(title).encode_wide().chain(std::iter::once(0)).collect();
    let msg_wide: Vec<u16> = OsStr::new(message).encode_wide().chain(std::iter::once(0)).collect();

    unsafe {
        let result = MessageBoxW(
            None,
            PCWSTR::from_raw(msg_wide.as_ptr()),
            PCWSTR::from_raw(title_wide.as_ptr()),
            MB_YESNO | MB_ICONQUESTION,
        );
        result == IDYES
    }
}

#[cfg(not(target_os = "windows"))]
pub fn ask_yes_no_dialog(_title: &str, _message: &str) -> bool {
    true
}

/// Initializes diagnostic logging and the global panic hook.
pub fn init() {
    let log_path = get_log_path();

    let exe_path = std::env::current_exe()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "unknown".to_string());
    let cwd = std::env::current_dir()
        .map(|p| p.display().to_string())
        .unwrap_or_else(|_| "unknown".to_string());
    let args: Vec<String> = std::env::args().collect();

    let header = format!(
        "================================================================================\n\
         ᛗ MÍMIR BROWSER CORE v{} - SESSION LAUNCH\n\
         Timestamp: {}\n\
         Executable: {}\n\
         Current Working Dir: {}\n\
         CLI Arguments: {:?}\n\
         Crash Log Location: {}\n\
         ================================================================================",
        env!("CARGO_PKG_VERSION"),
        current_timestamp(),
        exe_path,
        cwd,
        args,
        log_path.display()
    );

    info(&header);

    // Install panic hook
    std::panic::set_hook(Box::new(move |panic_info| {
        let payload = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            (*s).to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic payload".to_string()
        };

        let location = if let Some(loc) = panic_info.location() {
            format!("{}:{}:{}", loc.file(), loc.line(), loc.column())
        } else {
            "unknown location".to_string()
        };

        let crash_details = format!(
            "FATAL PANIC DETECTED!\n\
             Location: {}\n\
             Message: {}\n\
             Log File: {}",
            location,
            payload,
            log_path.display()
        );

        error(&crash_details);

        show_native_error_dialog(
            "ᛗ Mímir Browser — Runic Fracture (Crash)",
            &format!(
                "ᛗ Mímir encountered a critical runtime error and must close.\n\n\
                 Location: {}\n\
                 Detail: {}\n\n\
                 Diagnostic crash telemetry has been saved to:\n\
                 {}",
                location,
                payload,
                log_path.display()
            ),
        );
    }));
}
