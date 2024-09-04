mod extension;
mod extension_host;

pub use extension::Extension;
pub use extension_host::ExtensionHost;

use crate::app::App;

pub async fn init(app: App) {
    let extension_host = app.extension_host.read().await;
    let extensions = extension_host.search_extensions();

    drop(extension_host);

    for extension in extensions {
        extension.activate(app.clone()).await;
    }
}
