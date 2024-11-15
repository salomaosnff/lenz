use lenz_core::invoke::{InvokeRequest, InvokeResult};

pub async fn read(invoke: InvokeRequest) -> impl Into<InvokeResult> {
    match invoke.args.get_text("path") {
        Some(path) => std::fs::read(path).map_err(|e| e.to_string()),
        None => Err("Missing `path` argument".to_string()),
    }
}

pub async fn write(invoke: InvokeRequest) -> impl Into<InvokeResult> {
    match invoke.args.get_text("path") {
        Some(path) => match invoke.args.get_bytes("data") {
            Some(data) => {
                std::fs::create_dir_all(std::path::Path::new(&path).parent().unwrap())
                    .map_err(|e| e.to_string())?;
                return std::fs::write(path, data).map_err(|e| e.to_string());
            }
            None => Err("Missing `data` argument".to_string()),
        },
        None => Err("Missing `path` argument".to_string()),
    }
}