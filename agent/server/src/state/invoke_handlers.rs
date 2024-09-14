use std::{collections::HashMap, future::Future, pin::Pin, sync::Arc};

use hyper::body::Incoming;
use lenz_core::invoke::{
    form::{Form, FormFile, FormValue},
    InvokeHandler, InvokeRequest, InvokeResult,
};

use futures_util::StreamExt;
use http::{header::CONTENT_TYPE, Request};
use http_body_util::BodyStream;
use mime_guess::mime::APPLICATION_OCTET_STREAM;
use multer::Multipart;

pub async fn request_to_form(request: Request<Incoming>) -> Option<Form> {
    let (parts, body) = request.into_parts();

    let boundary = parts
        .headers
        .get(CONTENT_TYPE)
        .and_then(|ct| ct.to_str().ok())
        .and_then(|ct| multer::parse_boundary(ct).ok())?;

    let stream = BodyStream::new(body)
        .filter_map(|result| async move { result.map(|frame| frame.into_data().ok()).transpose() });

    let mut multipart = Multipart::new(stream, boundary);

    let mut form = Form::new();

    while let Some(field) = multipart.next_field().await.ok()? {
        let name = field
            .name()
            .clone()
            .map(|name| name.to_string())
            .unwrap_or_default();

        if let Some(filename) = field.file_name().map(|name| name.to_string()) {
            
            if filename == "blob" {
                form.append(name, FormValue::Bytes(field.bytes().await.unwrap_or_default()));
            } else {
                let content_type = field
                    .content_type()
                    .cloned()
                    .unwrap_or(APPLICATION_OCTET_STREAM);
                let data = field.bytes().await.unwrap_or_default();

                let file = FormFile {
                    filename,
                    content_type,
                    data,
                };

                form.append(name, FormValue::File(file));
            }
        } else {
            let text = field.text().await.unwrap_or_default();
            form.append(name, FormValue::Text(text));
        }
    }

    Some(form)
}

pub struct InvokeHandlers {
    pub handlers: HashMap<String, Arc<InvokeHandler>>,
}

impl InvokeHandlers {
    pub fn new() -> Self {
        Self {
            handlers: HashMap::new(),
        }
    }

    pub fn add<F>(&mut self, command: &str, handler: F)
    where
        F: Fn(InvokeRequest) -> Pin<Box<dyn Future<Output = InvokeResult> + Send + Sync>>
            + 'static
            + Send
            + Sync,
    {
        self.handlers.insert(command.to_string(), Arc::new(handler));
    }

    pub fn remove(&mut self, command: &str) {
        self.handlers.remove(command);
    }

    pub fn extend(&mut self, handlers: HashMap<String, Arc<InvokeHandler>>) {
        self.handlers.extend(handlers);
    }

    pub async fn invoke(&self, request: InvokeRequest) -> InvokeResult {
        if let Some(handler) = self.handlers.get(&request.command) {
            handler(request).await
        } else {
            InvokeResult::Error(format!("No handler for command: {}", request.command))
        }
    }
}

pub async fn get_invoke_request(req: Request<Incoming>) -> Option<InvokeRequest> {
    let command = req.uri().path().trim_start_matches('/').to_string();
    let args = request_to_form(req).await?;

    Some(InvokeRequest { command, args })
}

#[macro_export]
macro_rules! define_invoke_handlers {
    ($app:expr, {$($name:expr => $handler:expr),*}) => {
        {
            let mut handlers = $app.invoke_handlers.write().await;

            $(
                handlers.add($name, |invoke_request| Box::pin(async {
                    let result: lenz_core::invoke::InvokeResult = $handler(invoke_request).await.into();
                    return result;
                }));
            )*
        }
    };
}
