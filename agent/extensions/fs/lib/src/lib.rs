use std::sync::Arc;

use lenz_core::invoke::{InvokeRequest, InvokeResult};

#[no_mangle]
pub fn execute(context: std::sync::Arc<lenz_core::context::ExtensionContext>) {
    context.add_invoke_handlers(lenz_core::define_invoke! {
        "fs.read" => fs_read
    });
}

async fn fs_read(invoke: InvokeRequest) -> InvokeResult {
    if let Some(path) = invoke.args.get_text("path") {
        if let Ok(content) = std::fs::read_to_string(path) {
            return content.into();
        }
    }

    InvokeResult::Error("Path is not provided!".into())
}