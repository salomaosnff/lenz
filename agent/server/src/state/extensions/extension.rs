use lenz_core::{
    config::consts::BASE_URL,
    context::ExtensionContext,
    extensions::manifest::{ExtensionError, ExtensionManifest},
};
use libloading::Library;
use std::{collections::HashMap, path::PathBuf, sync::Arc};

use crate::app::{search_esm_files, App};

pub struct Extension {
    path: PathBuf,
    is_builtin: bool,
    pub context: Arc<ExtensionContext>,
    dynlib: Option<Library>,
}

impl Extension {
    pub fn from_dir(path: &PathBuf) -> Result<Self, ExtensionError> {
        ExtensionManifest::from_path(path).map(|manifest| {
            let built_in_extensions_dir = lenz_core::config::util::built_in_extensions();

            let ext = Extension {
                path: path.clone(),
                context: Arc::new(ExtensionContext::new(manifest)),
                dynlib: None,
                is_builtin: path.starts_with(built_in_extensions_dir),
            };

            ext.context
                .add_import_map(search_esm_files(&ext.dir().join("esm"), Some(&ext)));

            return ext;
        })
    }

    pub fn is_builtin(&self) -> bool {
        self.is_builtin
    }

    pub fn import_map(&self) -> HashMap<String, String> {
        self.context
            .import_map
            .read()
            .expect("Failed to read import map")
            .clone()
    }

    pub fn id(&self) -> String {
        self.context.manifest.id.clone()
    }

    pub fn static_route(&self) -> String {
        format!("/extensions/{}", self.id())
    }

    pub fn public_url(&self) -> String {
        format!("{BASE_URL}{}", self.static_route())
    }

    pub fn manifest(&self) -> &ExtensionManifest {
        &self.context.manifest
    }

    pub fn dir(&self) -> &PathBuf {
        &self.path
    }

    pub fn has_main_script(&self) -> bool {
        !self
            .context
            .manifest
            .main
            .as_ref()
            .map(|main| main.is_empty())
            .unwrap_or(false)
    }

    pub fn main_script_url(&self) -> Option<String> {
        if let Some(main) = self.context.manifest.main.clone() {
            let public_url = self.public_url();
            Some(format!("{public_url}/{main}"))
        } else {
            None
        }
    }

    pub async fn activate(self, app: App) {
        let mut extension_host = app.extension_host.write().await;
        let mut static_files = app.static_files.write().await;

        if extension_host.has(&self.id()) {
            println!("Extension {} already activated", self.id());
            return;
        }

        let context = self.context.clone();
        let extension = Arc::new(self);
        let manifest = extension.manifest();

        if let Some(lib) = manifest.dynlib.clone() {
            app.load_dynlib_extension(extension.path.join(lib), context)
                .unwrap();
        }

        static_files.add(&extension.static_route(), extension.dir().clone());
        app.import_map.write().await.extend(extension.import_map());
        extension_host.add(extension);
    }

    pub async fn deactivate(self, app: App) {
        let manifest = self.manifest();

        if !app.extension_host.read().await.has(&manifest.id) {
            println!("Extension {} already deactivated", self.id());
            return;
        }

        app.static_files.write().await.remove(&self.static_route());

        app.extension_host.write().await.remove(&manifest.id);

        if let Some(lib) = self.dynlib {
            lib.close().ok();
        }
    }
}
