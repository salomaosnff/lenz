use std::{collections::HashMap, sync::Arc};

use crate::{extensions::manifest::ExtensionManifest, invoke::InvokeHandler};

pub struct ExtensionContext {
    pub manifest: ExtensionManifest,
    pub invoke_handlers: tokio::sync::RwLock<HashMap<String, Arc<InvokeHandler>>>,
    pub import_map: std::sync::RwLock<HashMap<String, String>>,
}

impl ExtensionContext {
    pub fn new(manifest: ExtensionManifest) -> Self {
        ExtensionContext {
            manifest,
            invoke_handlers: tokio::sync::RwLock::new(HashMap::new()),
            import_map: std::sync::RwLock::new(HashMap::new()),
        }
    }

    pub fn add_invoke_handlers(&self, handlers: HashMap<String, Arc<InvokeHandler>>) {
        self.invoke_handlers.blocking_write().extend(handlers);
    }

    pub fn add_import_map(&self, import_map: HashMap<String, String>) {
        self.import_map
        .write()
        .expect("Failed to write import map")
        .extend(import_map);
    }
}
