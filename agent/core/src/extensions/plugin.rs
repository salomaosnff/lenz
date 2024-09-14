use std::{collections::HashMap, fmt::Debug, sync::Arc};

use crate::invoke::InvokeHandler;

use super::manifest::ExtensionManifest;

pub struct LenzPluginContext {
    pub manifest: ExtensionManifest,
    pub invoke_handlers: HashMap<String, Arc<InvokeHandler>>,
    pub import_map: HashMap<String, String>,
}

impl Debug for LenzPluginContext {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("LenzPluginContext")
            .field("manifest", &self.manifest)
            .field("invoke_handlers", &self.invoke_handlers.keys())
            .field("import_map", &self.import_map.keys())
            .finish()
    }
}

impl LenzPluginContext {
    pub fn new(manifest: ExtensionManifest) -> Self {
        Self {
            manifest,
            invoke_handlers: HashMap::new(),
            import_map: HashMap::new(),
        }
    }
}

pub trait LenzPlugin: Send + Sync {
    fn activate(&mut self, context: &mut LenzPluginContext);
    fn destroy(&self, context: &mut LenzPluginContext);
}
