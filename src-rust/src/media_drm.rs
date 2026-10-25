use std::path::{Path, PathBuf};
use crate::logger;

pub const DEFAULT_EDGE_USER_AGENT: &str = 
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0";

/// Configures global WebView2 environment flags for DRM (Widevine, PlayReady)
/// and hardware accelerated media codecs (H.264, VP9, AV1, AAC, etc.).
pub fn configure_media_environment(data_dir: &Path) {
    let drm_flags = [
        "--enable-features=HardwareSecureDecryption,msPlayReady,PlatformEncryptedDolbyVision,EncryptedMediaExtensions,AudioServiceOutOfProcess",
        "--enable-widevine-cdm",
        "--enable-accelerated-video-decode",
        "--enable-gpu-rasterization",
        "--ignore-gpu-blocklist",
        "--autoplay-policy=no-user-gesture-required",
    ].join(" ");

    // If existing arguments were already passed, append DRM flags
    let combined_args = match std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS") {
        Ok(existing) if !existing.is_empty() => format!("{} {}", existing, drm_flags),
        _ => drm_flags,
    };

    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", &combined_args);
    logger::info(&format!("ᛗ Inscribed Streaming DRM & Media Codec Arguments: {}", combined_args));

    // Ensure Widevine CDM directory is provisioned in the user data folder
    seed_widevine_cdm_if_needed(data_dir);
}

/// Recursively copies a directory and its contents
fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !dst.exists() {
        std::fs::create_dir_all(dst)?;
    }
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            std::fs::copy(&src_path, &dst_path)?;
        }
    }
    Ok(())
}

/// Probes the system for existing Widevine CDM installations (Microsoft Edge, Chrome,
/// or Windows CBS packages) and seeds them into Mímir's EBWebView directory if absent.
pub fn seed_widevine_cdm_if_needed(data_dir: &Path) {
    let target_widevine_root = data_dir.join("EBWebView").join("WidevineCdm");
    
    // Check if target already has a valid Widevine CDM binary
    if target_widevine_root.exists() {
        if let Ok(entries) = std::fs::read_dir(&target_widevine_root) {
            for entry in entries.flatten() {
                if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                    let manifest = entry.path().join("manifest.json");
                    if manifest.exists() {
                        logger::info(&format!(
                            "ᛗ Widevine CDM detected in Mímir repository: {}",
                            entry.path().display()
                        ));
                        return;
                    }
                }
            }
        }
    }

    // Candidate host locations where Edge or Windows already maintains WidevineCdm
    let local_appdata = std::env::var("LOCALAPPDATA").unwrap_or_default();
    if local_appdata.is_empty() {
        return;
    }

    let local_path = PathBuf::from(&local_appdata);
    let candidate_dirs = [
        local_path.join(r"Microsoft\Edge\User Data\WidevineCdm"),
        local_path.join(r"Google\Chrome\User Data\WidevineCdm"),
        local_path.join(r"Packages\MicrosoftWindows.Client.CBS_cw5n1h2txyewy\LocalState\EBWebView\WidevineCdm"),
        local_path.join(r"app.selene.desktop\EBWebView\WidevineCdm"),
    ];

    for candidate in &candidate_dirs {
        if candidate.exists() {
            if let Ok(entries) = std::fs::read_dir(candidate) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() && path.join("manifest.json").exists() {
                        logger::info(&format!(
                            "ᛗ Harvesting Widevine CDM from host sanctuary: {} -> {}",
                            path.display(),
                            target_widevine_root.display()
                        ));
                        let target_version_dir = target_widevine_root.join(entry.file_name());
                        if let Err(e) = copy_dir_all(&path, &target_version_dir) {
                            logger::warn(&format!("Failed to seed Widevine CDM: {}", e));
                        } else {
                            logger::info("ᛗ Widevine CDM successfully seeded into Mímir EBWebView sanctuary");
                            return;
                        }
                    }
                }
            }
        }
    }
}
