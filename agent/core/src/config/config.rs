use std::path::PathBuf;

#[derive(Debug)]
pub struct AgentConfig {
    pub install_dir: PathBuf,
    pub resources_dir: PathBuf,
    pub esm_dir: PathBuf,
    pub www_dir: PathBuf,
    pub app_data_dir: PathBuf,
    pub built_in_extensions_dir: PathBuf,
    pub user_extensions_dir: PathBuf,
    pub settings_file: PathBuf,
    pub extensions_search_paths: Vec<PathBuf>,
}

impl AgentConfig {
    pub fn load() -> Self {
        Self {
            install_dir: crate::config::util::install_dir(),
            resources_dir: crate::config::util::resources_dir(),
            esm_dir: crate::config::util::esm_dir(),
            www_dir: crate::config::util::www_dir(),
            app_data_dir: crate::config::util::app_data(),
            built_in_extensions_dir: crate::config::util::built_in_extensions(),
            user_extensions_dir: crate::config::util::user_extensions(),
            settings_file: crate::config::util::settings(),
            extensions_search_paths: crate::config::util::extensions_search_paths(),
        }
    }
}