use std::{
    collections::{HashMap, HashSet},
    path::PathBuf,
    vec,
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Result, Runtime};

use crate::paths;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtensionSerchItem {
    pub id: String,
    pub dir: PathBuf,
    pub script_path: PathBuf,
    pub manifest_path: PathBuf,
    pub manifest: serde_json::Map<String, serde_json::Value>,
}

fn search_extensions_in_path(path: &PathBuf) -> Vec<ExtensionSerchItem> {
    if !path.exists() {
        println!("Path {} does not exist: ", path.to_str().unwrap());
        return vec![];
    }

    let mut extensions = vec![];

    for entry in path.read_dir().unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        let manifest_path = path.join("manifest.json");

        if !manifest_path.exists() {
            continue;
        }

        let manifest = match std::fs::read_to_string(&manifest_path) {
            Ok(content) => match serde_json::from_str(&content) {
                Ok(json) => match json {
                    serde_json::Value::Object(map) => map,
                    _ => {
                        println!(
                            "Manifest file {} is not an object",
                            manifest_path.to_str().unwrap()
                        );
                        continue;
                    }
                },
                Err(err) => {
                    println!(
                        "Error parsing manifest file {}: {}",
                        manifest_path.to_str().unwrap(),
                        err
                    );
                    continue;
                }
            },
            Err(err) => {
                println!(
                    "Error reading manifest file {}: {}",
                    manifest_path.to_str().unwrap(),
                    err
                );
                continue;
            }
        };

        let id = match manifest.get("id") {
            Some(serde_json::Value::String(id)) if !id.is_empty() => id.clone(),
            _ => {
                println!(
                    "Manifest file {} does not have an id",
                    manifest_path.to_str().unwrap()
                );
                continue;
            }
        };
        let script_path = match manifest.get("main") {
            Some(serde_json::Value::String(script_path)) if !script_path.is_empty() => {
                path.join(script_path)
            }
            _ => {
                println!(
                    "Manifest file {} does not have a main script",
                    manifest_path.to_str().unwrap()
                );
                continue;
            }
        };

        let extension = ExtensionSerchItem {
            id: id,
            dir: path,
            script_path,
            manifest_path,
            manifest,
        };

        extensions.push(extension);
    }

    extensions
}

fn sort_extensions(extensions: Vec<ExtensionSerchItem>) -> Vec<ExtensionSerchItem> {
    let extension_map: HashMap<String, ExtensionSerchItem> = extensions
        .into_iter()
        .map(|extension| (extension.id.clone(), extension))
        .collect();

    let mut sorted_extensions: Vec<ExtensionSerchItem> = vec![];

    fn dfs(
        extension_map: &HashMap<String, ExtensionSerchItem>,
        sorted_extensions: &mut Vec<ExtensionSerchItem>,
        visited: &mut HashSet<String>,
        current: &str,
    ) {
        if visited.contains(current) {
            return;
        }

        visited.insert(current.to_string());

        let extension = extension_map.get(current).unwrap();
        let providers = match extension.manifest.get("injects") {
            Some(serde_json::Value::Array(providers)) => providers
                .iter()
                .map(|p| match p {
                    serde_json::Value::String(p) if !p.is_empty() => extension_map
                        .iter()
                        .find(|(_, e)| match e.manifest.get("contributes") {
                            Some(serde_json::Value::Object(contributes)) => {
                                match contributes.get("providers") {
                                    Some(serde_json::Value::Array(providers)) => {
                                        providers.iter().any(|provider| match provider {
                                            serde_json::Value::String(provider) => provider == p,
                                            _ => false,
                                        })
                                    }
                                    _ => false,
                                }
                            }
                            _ => false,
                        })
                        .map(|(id, _)| id.clone())
                        .unwrap_or("".to_string()),
                    _ => "".to_string(),
                })
                .collect::<Vec<String>>(),
            _ => vec![],
        };
        let dependencies = match extension.manifest.get("depends") {
            Some(serde_json::Value::Array(dependencies)) => dependencies
                .iter()
                .map(|d| match d {
                    serde_json::Value::String(d) => d.clone(),
                    _ => "".to_string(),
                })
                .collect::<Vec<String>>(),
            _ => vec![],
        };

        for provider in providers {
            if !provider.is_empty() {
                dfs(extension_map, sorted_extensions, visited, &provider);
            }
        }

        for dependency in dependencies {
            if !dependency.is_empty() {
                dfs(extension_map, sorted_extensions, visited, &dependency);
            }
        }

        sorted_extensions.push(extension.clone());
    }

    let mut visited: HashSet<String> = HashSet::new();

    for extension in extension_map.keys() {
        dfs(
            &extension_map,
            &mut sorted_extensions,
            &mut visited,
            extension,
        );
    }

    sorted_extensions
}

#[tauri::command]
pub(crate) fn extensions_search<R: Runtime>(
    _app: AppHandle<R>,
) -> Result<Vec<ExtensionSerchItem>> {
    println!("Searching for extensions...");

    let extensions = paths::extensions_search_paths()
        .iter()
        .flat_map(|path| search_extensions_in_path(path))
        .collect::<Vec<ExtensionSerchItem>>();

    let extensions = sort_extensions(extensions);

    Ok(extensions)
}
