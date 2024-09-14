use lenz_core::{
    config::consts::BASE_URL,
    extensions::{
        manifest::{ExtensionError, ExtensionManifest},
        plugin::{LenzPlugin, LenzPluginContext},
    },
};
use libloading::Library;
use std::{collections::HashMap, fmt::Debug, path::PathBuf};

use crate::app::{load_dynlib_extension, search_esm_files, App};

pub struct Extension {
    path: PathBuf,
    is_builtin: bool,
    plugin_context: LenzPluginContext,
    plugin_instance: Option<Box<dyn LenzPlugin>>,
    dynlib: Option<Library>,
}

impl Debug for Extension {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Extension")
            .field("path", &self.path)
            .field("is_builtin", &self.is_builtin)
            .field("plugin_context", &self.plugin_context)
            .field(
                "plugin_instance",
                if self.plugin_instance.is_some() {
                    &"Some(Box<dyn LenzPlugin>)"
                } else {
                    &"None"
                },
            )
            .field("dynlib", &self.dynlib)
            .finish()
    }
}

impl Extension {
    pub fn from_dir(path: &PathBuf) -> Result<Self, ExtensionError> {
        ExtensionManifest::from_path(path).map(|manifest| {
            let built_in_extensions_dir = lenz_core::config::util::built_in_extensions();

            let mut ext = Extension {
                plugin_context: LenzPluginContext::new(manifest),
                path: path.clone(),
                dynlib: None,
                is_builtin: path.starts_with(built_in_extensions_dir),
                plugin_instance: None,
            };

            ext.plugin_context
                .import_map
                .extend(search_esm_files(&ext.dir().join("esm"), Some(&ext)));

            return ext;
        })
    }

    pub fn as_json(&self) -> serde_json::Value {
        serde_json::json!({
            "id": self.id(),
            "script_url": self.main_script_url(),
            "manifest": self.manifest(),
            "is_builtin": self.is_builtin(),
            "esm_url": self.esm_endpoint(),
            "public_url": self.www_endpoint(),
        })
    }

    pub fn is_builtin(&self) -> bool {
        self.is_builtin
    }

    pub fn import_map(&self) -> HashMap<String, String> {
        self.plugin_context.import_map.clone()
    }

    pub fn id(&self) -> String {
        self.manifest().id.clone()
    }

    pub fn endpoint(&self) -> String {
        format!("/extensions/{}", self.id())
    }

    pub fn www_endpoint(&self) -> String {
        format!("{}/www", self.endpoint())
    }

    pub fn esm_endpoint(&self) -> String {
        format!("{}/esm", self.endpoint())
    }

    pub fn base_url(&self) -> String {
        format!("{BASE_URL}{}", self.endpoint())
    }

    pub fn manifest(&self) -> &ExtensionManifest {
        &self.plugin_context.manifest
    }

    pub fn dir(&self) -> &PathBuf {
        &self.path
    }

    pub fn has_main_script(&self) -> bool {
        !self
            .manifest()
            .main
            .as_ref()
            .map(|main| main.is_empty())
            .unwrap_or(false)
    }

    pub fn main_script_url(&self) -> Option<String> {
        if let Some(main) = self.manifest().main.clone() {
            let public_url = self.base_url();
            Some(format!("{public_url}/{main}"))
        } else {
            None
        }
    }

    pub async fn activate(mut self, app: App) {
        let id = self.id();
        let mut extension_host = app.extension_host.write().await;

        if extension_host.has(&id) {
            println!("Extension {} already activated", self.id());
            return;
        }

        let mut static_files = app.static_files.write().await;
        let mut import_map = app.import_map.write().await;
        let mut invoke_handlers = app.invoke_handlers.write().await;

        let manifest = self.manifest();

        if let Some(lib) = manifest.dynlib.clone() {
            let (plugin, lib) =
                load_dynlib_extension(self.dir().join(lib), &mut self.plugin_context)
                    .expect("Failed to load dynlib");

            self.dynlib = Some(lib);
            self.plugin_instance = Some(plugin);
        }

        static_files.add(&self.endpoint(), self.dir().clone());

        import_map.extend(self.plugin_context.import_map.clone());
        invoke_handlers.extend(self.plugin_context.invoke_handlers.clone());

        extension_host.add(self);
    }

    pub async fn deactivate(mut self, app: App) {
        let id = self.id();
        
        {
            let mut invoke_handlers = app.invoke_handlers.write().await;

            for (key, _) in self.plugin_context.invoke_handlers.drain() {
                invoke_handlers.remove(&key);
            }
        }

        {
            let mut import_map = app.import_map.write().await;

            for (key, _) in self.plugin_context.import_map.drain() {
                import_map.remove(&key);
            }
        }

        {
            let mut static_files = app.static_files.write().await;
            static_files.remove(&self.endpoint());
        }

        {
            let mut extension_host = app.extension_host.write().await;
            extension_host.remove(&id);
        }
    }
}
