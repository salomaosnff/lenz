use std::path::PathBuf;

use crate::paths;

pub fn user_home() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        std::env::var("USERPROFILE")
            .map(|home| PathBuf::from(home))
            .unwrap_or_else(|_| std::env::current_dir().unwrap())
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::env::var("HOME")
            .map(|home| PathBuf::from(home))
            .unwrap_or_else(|_| std::env::current_dir().unwrap())
    }
}

pub fn app_data() -> PathBuf {
    if let Ok(dir) = std::env::var("LENZ_DIR") {
        return PathBuf::from(dir);
    }

    return user_home().join(".lenz");
}

pub fn resources_dir() -> PathBuf {
    // Custom
    if let Ok(dir) = std::env::var("LENZ_RESOURCES") {
        return PathBuf::from(dir);
    }

    // Development
    #[cfg(debug_assertions)]
    {
        return PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .unwrap()
            .to_path_buf();
    }

    // Linux
    #[cfg(all(not(debug_assertions), target_os = "linux"))]
    {
        return PathBuf::from("/usr/share/lenz");
    }

    // macOS
    #[cfg(all(not(debug_assertions), target_os = "macos"))]
    {
        return PathBuf::from("/Applications/lenz.app/Contents/Resources");
    }

    // Windows and other platforms
    #[cfg(all(not(debug_assertions), not(any(target_os = "linux", target_os = "macos"))))]
    {
        return std::env::current_exe()
            .unwrap()
            .parent()
            .unwrap()
            .join("resources")
            .to_path_buf();
    }
}

pub fn extensions() -> PathBuf {
    app_data().join("extensions")
}

pub fn user_config_file() -> PathBuf {
    app_data().join("config.json")
}

pub fn extensions_search_paths() -> Vec<PathBuf> {
    if let Ok(dirs) = std::env::var("LENZ_EXTENSIONS_SEARCH_PATHS") {
        return dirs.split(";").map(|dir| PathBuf::from(dir)).collect();
    }

    let mut paths = vec![
        paths::resources_dir().join("extensions"),
        paths::extensions(),
    ];

    if let Ok(dir) = std::env::var("LENZ_EXTENSIONS_INCLUDE_PATHS") {
        for path in dir.split(";") {
            paths.push(PathBuf::from(path));
        }
    }

    return paths;
}

pub fn init() -> Result<(), String> {
    let extensions_dir = extensions();

    if !extensions_dir.exists() {
        std::fs::create_dir_all(&extensions_dir)
            .map_err(|err| format!("Error creating extensions directory: {}", err))?;
    }

    let config_file = user_config_file();

    if !config_file.exists() {
        std::fs::write(&config_file, r#"{}"#)
            .map_err(|err| format!("Error creating user config file: {}", err))?;
    }

    Ok(())
}
