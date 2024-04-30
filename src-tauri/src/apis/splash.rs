use tauri::{AppHandle, Manager, Runtime};

#[tauri::command]
pub fn splash_show<T: Runtime>(app: AppHandle<T>) {
    let main = app.get_webview_window("main").unwrap();
    let splash = app.get_webview_window("splash").unwrap();

    splash.center().unwrap();

    main.hide().unwrap();
    splash.show().unwrap();
}

#[tauri::command]
pub fn splash_hide<T: Runtime>(app: AppHandle<T>) {
    let main = app.get_webview_window("main").unwrap();
    let splash = app.get_webview_window("splash").unwrap();

    splash.hide().unwrap();
    main.show().unwrap();
}