use std::path::PathBuf;
use std::process::Command;
use tauri::{AppHandle, Manager};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;
use tokio_stream::wrappers::ReceiverStream;

// requires: .plugin(tauri_plugin_shell::init())

// module::binary::remove_quarantine_attribute(&app.app_handle().clone().app_handle(), "rg");
#[cfg(target_os = "macos")]
pub fn remove_quarantine_attribute(app_handle: &AppHandle, binary_name: &str) {
    let mut binary_path = PathBuf::from(app_handle.path().resource_dir().unwrap());
    binary_path.push(binary_name);

    Command::new("xattr")
        .arg("-d")
        .arg("com.apple.quarantine")
        .arg(&binary_path)
        .output()
        .expect("Failed to execute xattr command");
}

pub async fn spawn_binary(
    app_handle: &AppHandle,
    binary_name: &str,
    args: Vec<&str>,
) -> ReceiverStream<CommandEvent> {
    let sidecar_command = app_handle.shell().sidecar(binary_name).unwrap();
    let (rx, _child) = sidecar_command
        .args(args)
        .spawn()
        .expect("Failed to spawn sidecar");
    rx.into()
}

pub fn process_stdout_event(event: CommandEvent) -> Option<String> {
    if let CommandEvent::Stdout(line_bytes) = event {
        Some(String::from_utf8_lossy(&line_bytes).to_string())
    } else {
        None
    }
}
