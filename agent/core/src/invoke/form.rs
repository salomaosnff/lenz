use std::collections::HashMap;

use bytes::Bytes;
use mime_guess::Mime;


#[derive(Debug)]
pub struct FormFile {
    pub filename: String,
    pub content_type: Mime,
    pub data: Bytes,
}

#[derive(Debug)]
pub enum FormValue {
    Text(String),
    File(FormFile),
    Bytes(Bytes),
}

impl FormValue {
    pub fn as_text(&self) -> Option<&str> {
        match self {
            FormValue::Text(text) => Some(text.as_str()),
            _ => None,
        }
    }

    pub fn as_file(&self) -> Option<&FormFile> {
        match self {
            FormValue::File(file) => Some(file),
            _ => None,
        }
    }

    pub fn as_bytes(&self) -> Option<&Bytes> {
        match self {
            FormValue::Bytes(bytes) => Some(bytes),
            _ => None,
        }
    }
}

#[derive(Debug)]
pub struct Form {
    values: HashMap<String, Vec<FormValue>>,
}

impl Form {
    pub fn new() -> Self {
        Self {
            values: HashMap::new(),
        }
    }

    pub fn append(&mut self, key: String, value: FormValue) {
        self.values.entry(key).or_insert_with(Vec::new).push(value);
    }

    pub fn get_entry(&self, key: &str) -> Option<&FormValue> {
        self.values.get(key).and_then(|values| values.first())
    }

    pub fn get_entry_all(&self, key: &str) -> Option<&Vec<FormValue>> {
        self.values.get(key)
    }

    pub fn get_text(&self, key: &str) -> Option<&str> {
        self.get_entry(key).and_then(FormValue::as_text)
    }

    pub fn get_all_text(&self, key: &str) -> Option<Vec<&str>> {
        self.get_entry_all(key)
            .map(|values| values.iter().filter_map(FormValue::as_text).collect())
    }

    pub fn get_file(&self, key: &str) -> Option<&FormFile> {
        self.get_entry(key).and_then(FormValue::as_file)
    }

    pub fn get_all_files(&self, key: &str) -> Option<Vec<&FormFile>> {
        self.get_entry_all(key)
            .map(|values| values.iter().filter_map(FormValue::as_file).collect())
    }

    pub fn get_as<T: std::str::FromStr>(&self, key: &str) -> Option<T> {
        self.get_text(key).and_then(|text| text.parse().ok())
    }

    pub fn get_all_as<T: std::str::FromStr>(&self, key: &str) -> Option<Vec<T>> {
        self.get_all_text(key)
            .map(|texts| texts.iter().filter_map(|text| text.parse().ok()).collect())
    }

    pub fn get_bytes(&self, key: &str) -> Option<&Bytes> {
        self.get_entry(key).and_then(FormValue::as_bytes)
    }

    pub fn get_all_bytes(&self, key: &str) -> Option<Vec<&Bytes>> {
        self.get_entry_all(key)
            .map(|values| values.iter().filter_map(FormValue::as_bytes).collect())
    }
}