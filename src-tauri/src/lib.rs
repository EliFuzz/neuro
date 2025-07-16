use tauri::tray::{MouseButton, TrayIconBuilder};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    ActivationPolicy, Manager, WebviewUrl, WebviewWindowBuilder,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Transparent Titlebar Window")
                .transparent(true);
            let window = if let Some(w) = app.get_webview_window("main") {
                w
            } else {
                win_builder.build()?
            };
            window.show().unwrap();
            window.set_focus().unwrap();

            // set background color only when building for macOS
            #[cfg(target_os = "macos")]
            {
                use objc2_app_kit::{NSColor, NSWindow};

                // set window transparent
                app.set_activation_policy(ActivationPolicy::Accessory);

                // set background color to transparent
                let ns_window_handle = window.ns_window().unwrap();
                let ns_window: &mut NSWindow = unsafe { &mut *(ns_window_handle as *mut NSWindow) };
                unsafe {
                    let color = NSColor::colorWithSRGBRed_green_blue_alpha(
                        50.0 / 255.0,
                        158.0 / 255.0,
                        163.5 / 255.0,
                        0.0,
                    );
                    ns_window.setBackgroundColor(Some(&color));
                }
            }

            let app_handle = app.app_handle();
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app_handle, &[&quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(Image::from_path("./icons/icon.png")?)
                .menu(&menu)
                .on_tray_icon_event(|tray, event| match event {
                    tauri::tray::TrayIconEvent::Click {
                        button: MouseButton::Left,
                        position,
                        ..
                    } => {
                        let handle = tray.app_handle();
                        if let Some(window) = handle.get_webview_window("main") {
                            if let Some(monitor) = handle
                                .monitor_from_point(position.x, position.y)
                                .unwrap_or(None)
                            {
                                let monitor_pos = monitor.position();
                                let monitor_size = monitor.size();
                                let window_width = 800.0;
                                let window_height = 400.0;

                                let x = monitor_pos.x as f64
                                    + (monitor_size.width as f64 - window_width) / 2.0;
                                let y = monitor_pos.y as f64
                                    + (monitor_size.height as f64 - window_height) as f64 * 0.5
                                        / 2.0;

                                window
                                    .set_position(tauri::Position::Logical(
                                        tauri::LogicalPosition::new(x, y),
                                    ))
                                    .unwrap();
                            }
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    _ => {}
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
