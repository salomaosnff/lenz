use crate::entry::{Entry, EntryType};

pub fn path_is_hidden(path: &std::path::PathBuf) -> bool {
    path.file_name().unwrap().to_string_lossy().starts_with('.')
}

pub fn get_locals() -> Vec<Entry> {
    let username = whoami::realname();

    dirs::home_dir()
        .into_iter()
        .map(|path| ("folder-home", Some(username.as_str()), path))
        .chain(
            dirs::desktop_dir()
                .into_iter()
                .map(|path| ("folder-desktop", None, path)),
        )
        .chain(
            dirs::document_dir()
                .into_iter()
                .map(|path| ("folder-documents", None, path)),
        )
        .chain(
            dirs::download_dir()
                .into_iter()
                .map(|path| ("folder-downloads", None, path)),
        )
        .chain(
            dirs::audio_dir()
                .into_iter()
                .map(|path| ("folder-music", None, path)),
        )
        .chain(
            dirs::picture_dir()
                .into_iter()
                .map(|path| ("folder-pictures", None, path)),
        )
        .chain(
            dirs::video_dir()
                .into_iter()
                .map(|path| ("folder-videos", None, path)),
        )
        .filter_map(|(icon, name, path)| {
            if path.exists() {
                Some(Entry {
                    kind: EntryType::from(&path),
                    name: name.map_or_else(
                        || path.file_name().unwrap().to_string_lossy().to_string(),
                        |name| name.to_string(),
                    ).to_string(),
                    path: path.to_string_lossy().to_string(),
                    display_as: Some(icon.to_string()),
                    is_hidden: path_is_hidden(&path),
                    size: None,
                    created_at: path.metadata().unwrap().created().ok(),
                    modified_at: path.metadata().unwrap().modified().ok(),
                })
            } else {
                None
            }
        })
        .collect::<Vec<_>>()
}

pub fn get_disk_partitions() -> Vec<Entry> {
    let command = std::process::Command::new("df")
        .output()
        .expect("Failed to execute command");

    let output = String::from_utf8_lossy(&command.stdout);

    output
        .lines()
        .skip(1)
        .map(|line| {
            let parts = line.split_whitespace().collect::<Vec<_>>();
            let name = parts[0];
            let mount_point = parts[5];
            let used = parts[2];
            
            return Entry {
                kind: EntryType::DiskPartition,
                name: name.to_string(),
                path: mount_point.to_string(),
                is_hidden: false,
                display_as: None,
                created_at: None,
                modified_at: None,
                size: Some(used.parse::<u64>().unwrap()),
            }
        })
        .filter(|entry| entry.name.starts_with("/dev") && !entry.path.starts_with("/boot") && !matches!(entry.path.as_str(), "/home" | "/var" | "/opt"))
        .map(|mut entry| {
            if entry.path == "/" {
                entry.name = "Raíz do sistema".to_string();
            } else if entry.path.starts_with("/media") {
                entry.name = entry.path.split('/').last().unwrap().to_string();
            }

            entry
        })
        .collect()
}