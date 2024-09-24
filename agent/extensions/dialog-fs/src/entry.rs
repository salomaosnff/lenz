use serde::Serialize;

#[derive(Debug, Serialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum EntryType {
    DiskPartition,
    Directory,
    File,
    Symlink(String, Box<EntryType>),
}

impl From<&std::path::PathBuf> for EntryType {
    fn from(path: &std::path::PathBuf) -> Self {
        if path.is_dir() {
            EntryType::Directory
        } else if path.is_file() {
            EntryType::File
        } else if path.is_symlink() {
            let target = path.read_link().unwrap();
            EntryType::Symlink(target.to_string_lossy().to_string(), Box::new(EntryType::from(&target)))
        } else {
            EntryType::DiskPartition
        }
    }
}

#[derive(Debug, Serialize)]
pub struct Entry {
    pub kind: EntryType,
    pub name: String,
    pub path: String,
    pub display_as: Option<String>,
    pub is_hidden: bool,
    pub size: Option<u64>,

    #[serde(serialize_with = "serialize_system_data")]
    pub modified_at: Option<std::time::SystemTime>,

    #[serde(serialize_with = "serialize_system_data")]
    pub created_at: Option<std::time::SystemTime>,
}

fn serialize_system_data<S>(data: &Option<std::time::SystemTime>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    match data {
        Some(data) => {
            let data = data.duration_since(std::time::UNIX_EPOCH).unwrap();
            serializer.serialize_some(&data.as_secs())
        }
        None => serializer.serialize_none(),
    }
}