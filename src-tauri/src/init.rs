use tauri::{plugin::TauriPlugin, Runtime};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    tauri::plugin::Builder::new("init")
        .js_init_script(include_str!("init.js").to_string())
        .build()
}