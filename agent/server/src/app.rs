use std::{
    collections::HashMap,
    fs::{self, DirEntry},
    io::Error,
    path::PathBuf,
    sync::Arc,
};

use lenz_core::{
    config::consts::BASE_URL,
    define_invoke_handlers,
    extensions::plugin::{LenzPlugin, LenzPluginContext},
    invoke::InvokeResult,
};
use libloading::Library;

use crate::state::{
    extensions::{Extension, ExtensionHost},
    invoke_handlers::InvokeHandlers,
    static_assets::StaticAssets,
};

pub struct AppState {
    #[allow(dead_code)]
    pub config: Arc<lenz_core::config::AgentConfig>,
    pub static_files: tokio::sync::RwLock<StaticAssets>,
    pub extension_host: tokio::sync::RwLock<ExtensionHost>,
    pub import_map: tokio::sync::RwLock<HashMap<String, String>>,
    pub invoke_handlers: tokio::sync::RwLock<InvokeHandlers>,
}

pub type App = Arc<AppState>;

// one possible implementation of walking a directory only visiting files
fn visit_dirs(dir: &PathBuf, cb: &mut dyn FnMut(&DirEntry)) -> Result<(), Error> {
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                visit_dirs(&path, cb)?;
            } else {
                cb(&entry);
            }
        }
    }
    Ok(())
}

pub fn search_esm_files(
    dir: &PathBuf,
    user_extension: Option<&Extension>,
) -> HashMap<String, String> {
    let (prefix_name, prefix_url) = user_extension
        .map(|ext| {
            let id = ext.id();
            let public_url = ext.base_url();
            let relative_path = dir.strip_prefix(&ext.dir()).unwrap().to_str().unwrap();
            let script_url = format!("{public_url}/{relative_path}");

            if ext.is_builtin() {
                return (id, script_url);
            }
            (format!("ext/{id}"), script_url)
        })
        .unwrap_or_else(|| ("".to_string(), format!("{BASE_URL}/esm")));

    let mut import_map: HashMap<String, String> = HashMap::new();

    visit_dirs(dir, &mut |entry| {
        let path = entry.path();
        let ext = path.extension().unwrap_or_default();

        if ext == "js" || ext == "mjs" {
            let relative_path = path.strip_prefix(dir).unwrap();

            let name = relative_path.with_extension("");
            let name = name.to_str().unwrap();
            let name = if name.ends_with("/index") {
                name.trim_end_matches("/index")
            } else if name == "index" {
                ""
            } else {
                name
            };

            let name = if prefix_name.is_empty() {
                format!("lenz:{name}")
            } else {
                format!("lenz:{prefix_name}/{name}")
            };
            let name = name.trim_matches('/').to_string();

            let url = relative_path.to_str().unwrap();
            let url = format!("{prefix_url}/{url}");

            import_map.insert(name, url);
        }
    })
    .ok();

    import_map
}

impl AppState {
    pub fn new() -> Arc<Self> {
        let config = Arc::new(lenz_core::config::AgentConfig::load());
        let mut static_assets = StaticAssets::new(config.www_dir.clone());

        let mut invoke_handlers = InvokeHandlers::new();

        invoke_handlers.extend(define_invoke_handlers! {
            "app.quit" => |_| async {
                InvokeResult::Quit
            }
        });

        static_assets.add("/esm/", config.esm_dir.clone());

        Arc::new(Self {
            import_map: tokio::sync::RwLock::new(search_esm_files(&config.esm_dir, None)),
            extension_host: tokio::sync::RwLock::new(ExtensionHost::new(config.clone())),
            static_files: tokio::sync::RwLock::new(static_assets),
            invoke_handlers: tokio::sync::RwLock::new(invoke_handlers),
            config,
        })
    }

    pub async fn get_importmap(&self) -> HashMap<String, String> {
        self.import_map.read().await.clone()
    }
}

pub fn load_dynlib_extension(
    lib_path: PathBuf,
    context: &mut LenzPluginContext,
) -> Result<(Box<dyn LenzPlugin>, Library), Box<dyn std::error::Error>> {
    let base_name = lib_path.file_name().unwrap_or_default();
    let dirname = lib_path
        .parent()
        .expect("Library path must have a parent directory");
    let lib_path = dirname.join(libloading::library_filename(base_name.to_str().unwrap()));

    unsafe {
        let lib = libloading::Library::new(lib_path).expect("Failed to load library");
        let create_plugin: libloading::Symbol<fn(&mut LenzPluginContext) -> *mut dyn LenzPlugin> =
            lib.get(b"create_plugin").expect("Failed to load symbol");

        let mut plugin = Box::from_raw(create_plugin(context));

        plugin.activate(context);

        Ok((plugin, lib))
    }
}
