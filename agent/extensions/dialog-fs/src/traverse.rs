use std::{cmp::Ordering, collections::HashMap, path::PathBuf};

use serde::Deserialize;
use unicode_normalization::UnicodeNormalization;

use crate::{
    entry::{Entry, EntryType},
    folders::path_is_hidden,
};

#[derive(Deserialize)]
pub struct Sort(pub String, pub bool);

type SortComparator = fn(&Entry, &Entry) -> Ordering;

pub struct ListAllOptions {
    pub show_hidden: bool,
    pub query: String,
    pub only_folders: bool,
    pub sort_by: Vec<Sort>,
    pub filter: Vec<String>,
}

pub fn list(dir: String, options: ListAllOptions) -> Vec<Entry> {
    let path = PathBuf::from(dir);

    if path.is_symlink() {
        let target = path.read_link().unwrap();
        return list(target.to_string_lossy().to_string(), options);
    }

    let mut comparators: HashMap<&str, SortComparator> = HashMap::new();

    comparators.insert("kind", |a, b| a.kind.cmp(&b.kind));

    comparators.insert("name", |a, b| {
        let a_name = a.name.nfkd().collect::<String>();
        let b_name = b.name.nfkd().collect::<String>();

        a_name.cmp(&b_name)
    });

    comparators.insert("path", |a, b| {
        a.path.to_lowercase().cmp(&b.path.to_lowercase())
    });

    comparators.insert("size", |a, b| a.size.unwrap_or(0).cmp(&b.size.unwrap_or(0)));

    comparators.insert("created_at", |a, b| {
        a.created_at.unwrap().cmp(&b.created_at.unwrap())
    });

    comparators.insert("modified_at", |a, b| {
        a.modified_at.unwrap().cmp(&b.modified_at.unwrap())
    });

    comparators.insert("display_as", |a, b| {
        a.display_as
            .clone()
            .unwrap_or("".to_string())
            .cmp(&b.display_as.clone().unwrap_or("".to_string()))
    });

    comparators.insert("is_hidden", |a, b| a.is_hidden.cmp(&b.is_hidden));

    let mut entries = Vec::new();

    if path.is_dir() {
        for entry in path.read_dir().unwrap() {
            let entry = entry.unwrap();
            let path = entry.path();
            let name = path.file_name().unwrap().to_string_lossy().to_string();

            entries.push(Entry {
                kind: EntryType::from(&path),
                name,
                path: path.to_string_lossy().to_string(),
                display_as: None,
                is_hidden: path_is_hidden(&path),
                size: if path.is_file() {
                    Some(path.metadata().unwrap().len())
                } else {
                    None
                },
                created_at: entry.metadata().unwrap().created().ok(),
                modified_at: entry.metadata().unwrap().modified().ok(),
            });
        }
    }

    let filter = options.filter.clone();

    entries = entries
        .into_iter()
        .filter(|entry| options.show_hidden || !entry.is_hidden)
        .filter(|entry| !options.only_folders || entry.kind == EntryType::Directory)
        .filter(|entry| {
            entry.kind == EntryType::Directory
                || filter.is_empty()
                || filter.iter().any(|filter| {
                    let pattern = filter.replace(".", r"\.").replace("*", ".*");
                    let re = regex::Regex::new(format!("^{}$", pattern).as_str()).unwrap();

                    re.is_match(&entry.path)
                })
        })
        .filter(|entry| {
            options.query.is_empty()
                || entry
                    .name
                    .to_lowercase()
                    .contains(&options.query.to_lowercase())
        })
        .collect::<Vec<_>>();

    for sort in options.sort_by.iter().rev() {
        let Sort(field, asc) = sort;
        let comparator = comparators.get(field.as_str()).unwrap();

        entries.sort_by(|a, b| {
            let order = comparator(a, b);

            if *asc {
                order
            } else {
                order.reverse()
            }
        });
    }

    entries
}
