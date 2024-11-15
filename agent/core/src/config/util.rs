use std::path::PathBuf;

pub fn install_dir() -> PathBuf {
    if let Some(cargo_manifest_dir) = std::env::var("CARGO_MANIFEST_DIR").ok() {
        PathBuf::from(cargo_manifest_dir)
            .join("../../dist/plain")
            .canonicalize()
            .expect("Failed to get canonical path")
    } else {
        let x = std::env::current_exe()
            .expect("Failed to get current exe")
            .parent()
            .expect("Failed to get parent")
            .join("../")
            .canonicalize()
            .expect("Failed to get canonical path")
            .to_path_buf();

        x
    }
}

pub fn resources_dir() -> PathBuf {
    std::env::var("LENZ_RESOURCES_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| install_dir().join("resources"))
}

pub fn esm_dir() -> PathBuf {
    let dir = std::env::var("LENZ_ESM_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| resources_dir().join("esm"));

    dir
}

pub fn vendor_dir() -> PathBuf {
    let dir = std::env::var("LENZ_ESM_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| resources_dir().join("vendor"));

    dir
}

pub fn www_dir() -> PathBuf {
    std::env::var("LENZ_WWW_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| resources_dir().join("www"))
}

pub fn app_data() -> PathBuf {
    std::env::var("LENZ_APP_DATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| dirs::home_dir().unwrap_or_else(install_dir).join(".lenz"))
}

pub fn built_in_extensions() -> PathBuf {
    std::env::var("LENZ_BUILT_IN_EXTENSIONS_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| install_dir().join("extensions"))
}

pub fn user_extensions() -> PathBuf {
    std::env::var("LENZ_USER_EXTENSIONS_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| app_data().join("extensions"))
}

pub fn settings() -> PathBuf {
    std::env::var("LENZ_SETTINGS_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| app_data().join("settings.json"))
}

pub fn include_extension_search_path() -> Vec<PathBuf> {
    std::env::var("LENZ_INCLUDE_EXTENSION_PATHS")
        .unwrap_or_else(|_| "".to_string())
        .split(",")
        .map(PathBuf::from)
        .collect()
}

pub fn extensions_search_paths() -> Vec<PathBuf> {
    if let Ok(paths) = std::env::var("LENZ_EXTENSIONS_SEARCH_PATHS") {
        paths
            .split(",")
            .filter_map(|path| PathBuf::from(path).canonicalize().ok())
            .filter(|path| {
                if path.exists() {
                    true
                } else {
                    eprintln!("{} does not exists", path.display());
                    false
                }
            })
            .collect()
    } else {
        vec![built_in_extensions(), user_extensions()]
            .into_iter()
            .chain(include_extension_search_path())
            .filter_map(|path| path.canonicalize().ok())
            .filter(|path| {
                if path.exists() {
                    true
                } else {
                    eprintln!("{} does not exists", path.display());
                    false
                }
            })
            .collect()
    }
}
