use std::{collections::HashSet, path::PathBuf};

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub enum ExtensionIcon {
  Svg(String),
  Native(String),
}

pub enum NativePanel {
  Explorer,
  Properties,
}

pub enum ExtensionPanel {
  Native(NativePanel),
  Other(String),
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ExtensionManifestSys {
  pub linux: Option<String>,
  pub windows: Option<String>,
  pub macos: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExtensionManifestContributesCommand {
  pub id: String,
  pub title: Option<String>,
  pub description: Option<String>,
  pub icon: Option<ExtensionIcon>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExtensionManifestContributesView {
  pub id: String,
  pub name: String,
  pub panel: Option<String>,
  pub icon: Option<ExtensionIcon>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExtensionManifestContributesPanel {
  pub id: String,
  pub name: String,
  pub icon: ExtensionIcon,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExtensionManifestContributesTool {
  pub id: String,
  pub name: String,
  pub icon: ExtensionIcon,
  pub description: Option<String>,
  pub priority: Option<i32>,
  pub parent: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExtensionManifestContributesProvider {
  pub id: String,
  pub name: String,
  pub description: Option<String>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ExtensionManifestContributesL10n {
  pub locale: String,
  pub path: String,
}

#[derive(Debug, std::default::Default, serde::Serialize, serde::Deserialize)]
pub struct ExtensionManifestContributes {
  pub commands: Vec<ExtensionManifestContributesCommand>,
  pub views: Vec<ExtensionManifestContributesView>,
  pub panels: Vec<ExtensionManifestContributesPanel>,
  pub tools: Vec<ExtensionManifestContributesTool>,
  pub providers: Vec<ExtensionManifestContributesProvider>,
  pub l10n: Vec<ExtensionManifestContributesL10n>,
}

fn default_activate_on() -> HashSet<String> {
  HashSet::from_iter(vec![String::from("main")])
}

#[derive(Debug, Default, serde::Serialize, serde::Deserialize)]
pub struct ExtensionManifest {
  pub id: String,
  pub name: String,
  pub description: String,
  pub version: String,
  pub publisher: String,
  pub main: Option<String>,
  #[serde(default = "default_activate_on")]
  pub activate_on: HashSet<String>,
  #[serde(default)]
  pub inject: HashSet<String>,
  #[serde(default)]
  pub depends: HashSet<String>,
  pub dynlib: Option<String>,
  #[serde(default)]
  pub contributes: ExtensionManifestContributes,
}

#[derive(Debug)]
pub enum ExtensionError {
  ManifestFileNotFound,
  FailedToLoadManifestFile(String),
  FailedToParseManifestFile(String),
  MainScriptNotFound,
}

impl std::fmt::Display for ExtensionError {
  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
    match self {
      ExtensionError::ManifestFileNotFound => {
        write!(f, "Manifest file not found")
      }
      ExtensionError::FailedToLoadManifestFile(err) => {
        write!(f, "Failed to load manifest file > {}", err)
      }
      ExtensionError::FailedToParseManifestFile(err) => {
        write!(f, "Failed to parse manifest file > {}", err)
      }
      ExtensionError::MainScriptNotFound => {
        write!(f, "Main script not found")
      }
    }
  }
}

impl ExtensionManifest {
  pub fn from_path(path: &PathBuf) -> Result<Self, ExtensionError> {
    let manifest_path = if path.is_dir() {
      let manifest_path = path.join("manifest.json");

      if manifest_path.is_file() {
        manifest_path
      } else {
        return Err(ExtensionError::ManifestFileNotFound);
      }
    } else {
      return Err(ExtensionError::ManifestFileNotFound);
    };
    
    let manifest = match std::fs::read_to_string(&manifest_path) {
      Ok(str) => str,
      Err(err) => return Err(ExtensionError::FailedToLoadManifestFile(err.to_string())),
    };

    let manifest: ExtensionManifest = match serde_json::from_str(&manifest) {
      Ok(manifest) => manifest,
      Err(err) => {
        return Err(ExtensionError::FailedToParseManifestFile(err.to_string()));
      }
    };

    if let Some(main_script_path) = manifest.main.clone() {
      let main_script_path = path.join(&main_script_path.trim_start_matches("..").trim_end_matches("/"));
      if !main_script_path.is_file() {
        return Err(ExtensionError::MainScriptNotFound);
      }
    }

    return Ok(manifest);
  }
}
