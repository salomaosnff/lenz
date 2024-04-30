// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod paths;
mod apis;
mod protocols;
mod init;

fn main() {
    if let Err(err) = paths::init() {
        eprintln!("Error initializing paths: {}", err);
        std::process::exit(1);
    }

    tauri::Builder::default()
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;

                let window = _app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(init::init())
        .register_uri_scheme_protocol("user", protocols::user)
        .invoke_handler(tauri::generate_handler![
            apis::extensions::extensions_search,
            apis::splash::splash_show,
            apis::splash::splash_hide,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
