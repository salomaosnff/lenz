use std::io::Error;

use bytes::Bytes;

pub enum InvokeResult {
    Json(serde_json::Value),
    Text(String),
    Binary(Bytes),
    Error(String),
    Void,
}

impl InvokeResult {
    pub fn label(&self) -> &str {
        match self {
            InvokeResult::Json(_) => "json",
            InvokeResult::Text(_) => "text",
            InvokeResult::Binary(_) => "binary",
            InvokeResult::Void => "void",
            InvokeResult::Error(_) => "error",
        }
    }
}

impl Into<InvokeResult> for serde_json::Value {
    fn into(self) -> InvokeResult {
        InvokeResult::Json(self)
    }
}

impl Into<InvokeResult> for String {
    fn into(self) -> InvokeResult {
        InvokeResult::Text(self)
    }
}

impl Into<InvokeResult> for Bytes {
    fn into(self) -> InvokeResult {
        InvokeResult::Binary(self)
    }
}

impl Into<InvokeResult> for () {
    fn into(self) -> InvokeResult {
        InvokeResult::Void
    }
}

impl Into<InvokeResult> for Vec<u8> {
    fn into(self) -> InvokeResult {
        InvokeResult::Binary(self.into())
    }
}

impl Into<InvokeResult> for &str {
    fn into(self) -> InvokeResult {
        InvokeResult::Text(self.to_string())
    }
}

impl Into<InvokeResult> for Error {
    fn into(self) -> InvokeResult {
        InvokeResult::Error(self.to_string())
    }
}

impl<T: Into<InvokeResult>, E: ToString> Into<InvokeResult> for Result<T, E> {
    fn into(self) -> InvokeResult {
        match self {
            Ok(value) => value.into(),
            Err(message) => InvokeResult::Error(message.to_string()),
        }
    }
}