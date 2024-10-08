use std::{collections::HashMap, sync::Arc};

use super::Extension;

pub struct ExtensionHost {
    config: Arc<lenz_core::config::AgentConfig>,
    pub extensions: HashMap<String, Extension>,
}

impl ExtensionHost {
    pub fn new(config: Arc<lenz_core::config::AgentConfig>) -> Self {
        Self {
            config,
            extensions: HashMap::new(),
        }
    }

    pub fn get(&self, id: &str) -> Option<&Extension> {
        self.extensions.get(id)
    }

    pub fn search_extensions(&self) -> impl Iterator<Item = Extension> {
        return self
            .config
            .extensions_search_paths
            .clone()
            .into_iter()
            .filter_map(|path| {
                if path.is_dir() {
                    if let Ok(entries) = std::fs::read_dir(&path) {
                        Some(entries)
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .flatten()
            .filter_map(|entry| {
                if let Ok(entry) = entry {
                    if entry.path().is_dir() {
                        Extension::from_dir(&entry.path()).ok()
                    } else {
                        None
                    }
                } else {
                    None
                }
            });
    }

    pub fn has(&self, id: &str) -> bool {
        self.extensions.contains_key(id)
    }

    pub fn add(&mut self, extension: Extension) {
        self.extensions.insert(extension.id(), extension);
    }

    pub fn remove(&mut self, id: &str) {
        self.extensions.remove(id);
    }

    pub async fn get_extensions_json(&self) -> serde_json::Value {
        let mut arr: Vec<serde_json::Value> = vec![];
        
        for extension in self.extensions.values() {
            let json = extension.as_json();

            arr.push(json);
        }

        serde_json::json!(arr)
    }
}
