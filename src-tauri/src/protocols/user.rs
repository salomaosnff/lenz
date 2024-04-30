use std::path::Path;

use tauri::{http::{Request, Response}, AppHandle, Runtime};

pub fn protocol<R: Runtime>(_app: &AppHandle<R>, request: Request<Vec<u8>>) -> Response<Vec<u8>> {
    let method = request.method();

    fn response(content_type:&str, content: Vec<u8>, status: u16) -> Response<Vec<u8>> {
        Response::builder()
            .status(status)
            .header("Content-Type", content_type)
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "GET")
            .header("Access-Control-Allow-Headers", "*")
            .header("Access-Control-Expose-Headers", "*")
            .body(content)
            .unwrap()
    }

    fn not_found() -> Response<Vec<u8>> {
        return response("text/plain", br"404 Not Found".to_vec(), 404);
    }

    fn method_not_allowed() -> Response<Vec<u8>> {
        return response("text/plain", br"405 Method Not Allowed".to_vec(), 405);
    }

    fn forbidden() -> Response<Vec<u8>> {
        return response("text/plain", br"403 Forbidden".to_vec(), 403);
    }

    if method == "OPTIONS" {
        return response("text/plain", vec![], 204)
    }

    if method != "GET" {
        return method_not_allowed();
    }

    let uri = request.uri().to_string();

    #[cfg(target_os = "windows")]
    let path = Path::new(uri.trim_start_matches("user://"));

    #[cfg(not(target_os = "windows"))]
    let path = Path::new(uri.trim_start_matches("user:/"));


    if !path.exists() {
        return not_found();
    }

    if path.is_dir() {
        return forbidden();
    }

    if let Ok(content) = std::fs::read(path) {
        response(mime_guess::from_path(&path).first_or_octet_stream().essence_str(), content, 200)
    } else {
        forbidden()
    }
}