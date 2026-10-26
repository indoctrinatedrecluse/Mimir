use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessItem {
    pub pid: u32,
    pub name: String,
    pub role: String,
    pub working_set_bytes: u64,
    pub commit_bytes: u64,
    pub is_main: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemTelemetryPayload {
    pub main_pid: u32,
    pub total_mimir_memory_bytes: u64,
    pub main_process_memory_bytes: u64,
    pub child_process_count: usize,
    pub processes: Vec<ProcessItem>,
    pub total_system_ram_bytes: u64,
    pub available_system_ram_bytes: u64,
    pub memory_load_percent: u32,
}

#[cfg(target_os = "windows")]
pub mod win_impl {
    use super::*;
    use std::collections::HashSet;
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
    };
    use windows::Win32::System::ProcessStatus::{
        K32EmptyWorkingSet, K32GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS_EX,
    };
    use windows::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};
    use windows::Win32::System::Threading::{
        GetCurrentProcess, GetCurrentProcessId, OpenProcess, TerminateProcess,
        PROCESS_QUERY_INFORMATION, PROCESS_SET_QUOTA, PROCESS_TERMINATE, PROCESS_VM_READ,
    };

    pub fn get_telemetry() -> SystemTelemetryPayload {
        let current_pid = unsafe { GetCurrentProcessId() };

        // 1. Gather global system RAM metrics
        let mut total_system_ram_bytes = 0u64;
        let mut available_system_ram_bytes = 0u64;
        let mut memory_load_percent = 0u32;

        unsafe {
            let mut mem_status = MEMORYSTATUSEX {
                dwLength: std::mem::size_of::<MEMORYSTATUSEX>() as u32,
                ..Default::default()
            };
            if GlobalMemoryStatusEx(&mut mem_status).is_ok() {
                total_system_ram_bytes = mem_status.ullTotalPhys;
                available_system_ram_bytes = mem_status.ullAvailPhys;
                memory_load_percent = mem_status.dwMemoryLoad;
            }
        }

        // 2. Discover all child and grandchild PIDs spawned by Mímir
        let mut mimir_pids: HashSet<u32> = HashSet::new();
        mimir_pids.insert(current_pid);

        let mut process_metadata: Vec<(u32, u32, String)> = Vec::new(); // (pid, parent_pid, name)

        unsafe {
            if let Ok(snapshot) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) {
                let mut entry = PROCESSENTRY32W {
                    dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
                    ..Default::default()
                };

                if Process32FirstW(snapshot, &mut entry).is_ok() {
                    loop {
                        let name_len = entry
                            .szExeFile
                            .iter()
                            .position(|&c| c == 0)
                            .unwrap_or(entry.szExeFile.len());
                        let name = String::from_utf16_lossy(&entry.szExeFile[..name_len]);

                        process_metadata.push((entry.th32ProcessID, entry.th32ParentProcessID, name));

                        if Process32NextW(snapshot, &mut entry).is_err() {
                            break;
                        }
                    }
                }
                let _ = CloseHandle(snapshot);
            }
        }

        // Multi-generation child discovery (children and grandchildren of Mímir)
        let mut changed = true;
        while changed {
            changed = false;
            for (pid, parent_pid, _) in &process_metadata {
                if mimir_pids.contains(parent_pid) && !mimir_pids.contains(pid) {
                    mimir_pids.insert(*pid);
                    changed = true;
                }
            }
        }

        // 3. Inspect memory counters for each discovered Mímir process
        let mut process_items: Vec<ProcessItem> = Vec::new();
        let mut total_mimir_memory_bytes = 0u64;
        let mut main_process_memory_bytes = 0u64;

        for (pid, _, name) in &process_metadata {
            if !mimir_pids.contains(pid) {
                continue;
            }

            let is_main = *pid == current_pid;
            let mut working_set = 0u64;
            let mut commit = 0u64;

            unsafe {
                let handle_res = if is_main {
                    Ok(GetCurrentProcess())
                } else {
                    OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, *pid)
                };

                if let Ok(handle) = handle_res {
                    let mut pmc = PROCESS_MEMORY_COUNTERS_EX {
                        cb: std::mem::size_of::<PROCESS_MEMORY_COUNTERS_EX>() as u32,
                        ..Default::default()
                    };

                    let pmc_ptr = &mut pmc as *mut _ as *mut _;
                    if K32GetProcessMemoryInfo(
                        handle,
                        pmc_ptr,
                        std::mem::size_of::<PROCESS_MEMORY_COUNTERS_EX>() as u32,
                    )
                    .as_bool()
                    {
                        working_set = pmc.WorkingSetSize as u64;
                        commit = pmc.PrivateUsage as u64;
                    }

                    if !is_main {
                        let _ = CloseHandle(handle);
                    }
                }
            }

            total_mimir_memory_bytes += working_set;
            if is_main {
                main_process_memory_bytes = working_set;
            }

            let role = if is_main {
                "Mímir Sovereign Core".to_string()
            } else if name.to_lowercase().contains("webview2") || name.to_lowercase().contains("edge") {
                if working_set > 200 * 1024 * 1024 {
                    "WebView2 GPU / Compositor Engine".to_string()
                } else if working_set > 80 * 1024 * 1024 {
                    "WebView2 Active Tab Renderer".to_string()
                } else {
                    "WebView2 Utility / Network Subprocess".to_string()
                }
            } else {
                "Auxiliary Worker".to_string()
            };

            process_items.push(ProcessItem {
                pid: *pid,
                name: name.clone(),
                role,
                working_set_bytes: working_set,
                commit_bytes: commit,
                is_main,
            });
        }

        // Sort: main process first, then by highest memory consumption descending
        process_items.sort_by(|a, b| {
            if a.is_main {
                std::cmp::Ordering::Less
            } else if b.is_main {
                std::cmp::Ordering::Greater
            } else {
                b.working_set_bytes.cmp(&a.working_set_bytes)
            }
        });

        let child_process_count = process_items.len().saturating_sub(1);

        SystemTelemetryPayload {
            main_pid: current_pid,
            total_mimir_memory_bytes,
            main_process_memory_bytes,
            child_process_count,
            processes: process_items,
            total_system_ram_bytes,
            available_system_ram_bytes,
            memory_load_percent,
        }
    }

    pub fn kill_process(pid: u32) -> bool {
        let current_pid = unsafe { GetCurrentProcessId() };
        if pid == current_pid || pid == 0 {
            return false; // Protect main host from suicide
        }

        unsafe {
            if let Ok(handle) = OpenProcess(PROCESS_TERMINATE, false, pid) {
                let success = TerminateProcess(handle, 1).is_ok();
                let _ = CloseHandle(handle);
                return success;
            }
        }
        false
    }

    pub fn reclaim_working_sets() -> u64 {
        let current_pid = unsafe { GetCurrentProcessId() };
        let before_mem = get_telemetry().total_mimir_memory_bytes;

        unsafe {
            // Trim main process working set
            let main_handle = GetCurrentProcess();
            let _ = K32EmptyWorkingSet(main_handle);

            // Trim child processes working sets
            if let Ok(snapshot) = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) {
                let mut entry = PROCESSENTRY32W {
                    dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
                    ..Default::default()
                };

                if Process32FirstW(snapshot, &mut entry).is_ok() {
                    loop {
                        if entry.th32ParentProcessID == current_pid {
                            if let Ok(child_handle) = OpenProcess(
                                PROCESS_QUERY_INFORMATION | PROCESS_SET_QUOTA,
                                false,
                                entry.th32ProcessID,
                            ) {
                                let _ = K32EmptyWorkingSet(child_handle);
                                let _ = CloseHandle(child_handle);
                            }
                        }
                        if Process32NextW(snapshot, &mut entry).is_err() {
                            break;
                        }
                    }
                }
                let _ = CloseHandle(snapshot);
            }
        }

        let after_mem = get_telemetry().total_mimir_memory_bytes;
        before_mem.saturating_sub(after_mem)
    }
}

#[cfg(not(target_os = "windows"))]
pub mod win_impl {
    use super::*;

    pub fn get_telemetry() -> SystemTelemetryPayload {
        SystemTelemetryPayload {
            main_pid: std::process::id(),
            total_mimir_memory_bytes: 180 * 1024 * 1024,
            main_process_memory_bytes: 120 * 1024 * 1024,
            child_process_count: 0,
            processes: vec![],
            total_system_ram_bytes: 16 * 1024 * 1024 * 1024,
            available_system_ram_bytes: 8 * 1024 * 1024 * 1024,
            memory_load_percent: 50,
        }
    }

    pub fn kill_process(_pid: u32) -> bool {
        false
    }

    pub fn reclaim_working_sets() -> u64 {
        0
    }
}

pub fn get_telemetry() -> SystemTelemetryPayload {
    win_impl::get_telemetry()
}

pub fn kill_process(pid: u32) -> bool {
    win_impl::kill_process(pid)
}

pub fn reclaim_working_sets() -> u64 {
    win_impl::reclaim_working_sets()
}
