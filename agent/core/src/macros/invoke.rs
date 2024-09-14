#[macro_export]
macro_rules! define_invoke_handlers {
    ($($name:expr => $handler:expr),*) => {
        {
            let mut handlers: std::collections::HashMap<String, std::sync::Arc<lenz_core::invoke::InvokeHandler>> = std::collections::HashMap::new();

            $(
                handlers.insert($name.into(), std::sync::Arc::new(|invoke_request| Box::pin(async {
                    let result: lenz_core::invoke::InvokeResult = $handler(invoke_request).await.into();
                    return result;
                })));
            )*

            handlers
        }
    };
}

#[macro_export]
macro_rules! define_handler {
    ($handler: expr) => {
        std::sync::Arc::new(|invoke_request| Box::pin(async {
            let result: lenz_core::invoke::InvokeResult = $handler(invoke_request).await.into();
            return result;
        }))
    };
}