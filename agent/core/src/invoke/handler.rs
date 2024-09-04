use std::{future::Future, pin::Pin};

use super::{request::InvokeRequest, result::InvokeResult};

pub type InvokeHandler = dyn Fn(InvokeRequest) -> Pin<Box<dyn Future<Output = InvokeResult> + Send + Sync>>
    + 'static
    + Send
    + Sync;