use std::{collections::HashMap, path::PathBuf};

pub struct StaticAssets {
    main_dir: PathBuf,
    prefixes: HashMap<String, PathBuf>,
}

impl StaticAssets {
    pub fn new(main_dir: PathBuf) -> Self {
        Self {
            main_dir,
            prefixes: HashMap::new(),
        }
    }
}

pub fn resolve_path(path: PathBuf) -> Option<PathBuf> {
    if path.is_file() {
        return Some(path);
    }

    if path.is_dir() {
        return resolve_path(path.join("index.html"));
    }

    None
}

pub fn normalize_prefix(prefix: &str) -> String {
    if prefix.ends_with('/') {
        prefix.to_string()
    } else {
        format!("{}/", prefix)
    }
}

impl StaticAssets {
    pub fn add(&mut self, prefix: &str, path: PathBuf) {
        let prefix = normalize_prefix(prefix);

        if self.prefixes.contains_key(&prefix) {
            eprintln!(
                "Cannot add static folder: prefix {:?} already exists",
                prefix
            );
        } else {
            self.prefixes.insert(prefix, path);
        }
    }

    pub fn remove(&mut self, route: &str) {
        let prefix = normalize_prefix(route);

        if self.prefixes.remove(&prefix).is_none() {
            eprintln!(
                "Cannot remove static folder: prefix {:?} does not exist",
                prefix
            );
        }
    }

    pub fn resolve(&self, route: &str) -> Option<PathBuf> {
        let file_path = self.main_dir.join(route.trim_matches('/'));

        if let Some(path) = resolve_path(file_path.clone()) {
            return Some(path);
        }

        for (prefix, path) in &self.prefixes {
            if !route.starts_with(prefix) {
                continue;
            }

            let file_path = path.join(route.trim_start_matches(prefix));

            if let Some(path) = resolve_path(file_path) {
                return Some(path);
            }
        }

        None
    }
}
