use std::path::{Path, PathBuf};
use std::net::{TcpStream, ToSocketAddrs};
use std::time::Duration;
use serde::{Deserialize, Serialize};
use crate::logger;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub enabled: bool,
    pub proxy_type: String, // "direct", "tor", "socks5", "http"
    pub server: String,     // e.g., "socks5://127.0.0.1:9050" or "http://127.0.0.1:8080"
    pub bypass_list: Option<String>, // e.g., "<local>;localhost;127.0.0.1;*.netflix.com"
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            proxy_type: "direct".to_string(),
            server: "".to_string(),
            bypass_list: Some("<local>;localhost;127.0.0.1".to_string()),
        }
    }
}

fn get_config_path(data_dir: &Path) -> PathBuf {
    data_dir.join("svalinn_proxy.json")
}

pub fn load_proxy_config(data_dir: &Path) -> ProxyConfig {
    let path = get_config_path(data_dir);
    if path.exists() {
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(config) = serde_json::from_str::<ProxyConfig>(&content) {
                return config;
            }
        }
    }
    ProxyConfig::default()
}

pub fn save_proxy_config(data_dir: &Path, config: &ProxyConfig) -> bool {
    let path = get_config_path(data_dir);
    if let Ok(json) = serde_json::to_string_pretty(config) {
        if std::fs::write(&path, json).is_ok() {
            logger::info(&format!("🛡️ Svalinn Proxy configuration updated: enabled={}, type={}, server={}", config.enabled, config.proxy_type, config.server));
            return true;
        }
    }
    false
}

/// Applies active proxy configurations to WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS
pub fn apply_proxy_to_environment(data_dir: &Path) {
    let config = load_proxy_config(data_dir);
    if !config.enabled || config.server.trim().is_empty() || config.proxy_type == "direct" {
        logger::info("🛡️ Svalinn Proxy: Direct Bifröst route active (No proxy override)");
        return;
    }

    let proxy_server_arg = format!("--proxy-server=\"{}\"", config.server.trim());
    let bypass_arg = config.bypass_list.as_deref().map(|b| {
        format!("--proxy-bypass-list=\"{}\"", b.trim())
    }).unwrap_or_else(|| "--proxy-bypass-list=\"<local>;localhost;127.0.0.1\"".to_string());

    let proxy_flags = format!("{} {}", proxy_server_arg, bypass_arg);

    let combined_args = match std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS") {
        Ok(existing) if !existing.is_empty() => format!("{} {}", existing, proxy_flags),
        _ => proxy_flags,
    };

    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", &combined_args);
    logger::info(&format!("🛡️ Svalinn Proxy Cloak Inscribed in Environment: {}", combined_args));
}

/// Tests TCP connectivity to a proxy host/port (e.g., Tor daemon at 127.0.0.1:9050 or SOCKS5 server)
pub fn test_connectivity(host: &str, port: u16) -> bool {
    let addr_str = format!("{}:{}", host, port);
    if let Ok(mut addrs) = addr_str.to_socket_addrs() {
        if let Some(addr) = addrs.next() {
            if TcpStream::connect_timeout(&addr, Duration::from_millis(1500)).is_ok() {
                return true;
            }
        }
    }
    false
}
