#[cfg(target_os = "windows")]
fn main() {
    let mut res = winres::WindowsResource::new();
    res.set_icon("mimir.ico");
    res.set("FileDescription", "Mimir Browser");
    res.set("ProductName", "Mimir Browser");
    res.set("InternalName", "mimir");
    res.set("OriginalFilename", "mimir.exe");
    if let Err(e) = res.compile() {
        eprintln!("Warning: Failed to compile Windows resource icon: {}", e);
    }
}

#[cfg(not(target_os = "windows"))]
fn main() {}
