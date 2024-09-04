use bytes::Bytes;
use http::{Method, Request};
use http_body_util::Full;
use hyper::body::Incoming;
use lenz_core::config::consts::{ADDR, BASE_URL};
use lenz_core::invoke::InvokeResult;
use std::convert::Infallible;
use std::pin::pin;
use std::time::Duration;
use tokio::net::TcpListener;

use crate::app::App;
use crate::state::invoke_handlers::get_invoke_request;

fn open_browser(url: &str) {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(&["/C", "start", url])
            .spawn()
            .expect("Failed to open browser");
    }

    #[cfg(any(target_os = "macos", target_os = "linux"))]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .expect("Failed to open browser");
    }

}

async fn countdown(message: &str, seconds: u32) {
    for i in (0..seconds).rev() {
        eprintln!("({}s) {}", i, message);
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}

pub fn create_response() -> http::response::Builder {
    let response = {
        #[cfg(debug_assertions)]
        {
            http::Response::builder().header("Access-Control-Allow-Origin", "*")
        }

        #[cfg(not(debug_assertions))]
        {
            http::Response::builder()
        }
    };

    return response.header("Access-Control-Expose-Headers", "X-Invoke-Result");
}

pub async fn start(app: App) -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting server at {}", BASE_URL);
    let listener = TcpListener::bind(ADDR).await?;

    #[cfg(not(debug_assertions))]
    open_browser(BASE_URL);

    let server = hyper_util::server::conn::auto::Builder::new(hyper_util::rt::TokioExecutor::new());
    let graceful = hyper_util::server::graceful::GracefulShutdown::new();
    let mut ctrl_c = pin!(tokio::signal::ctrl_c());

    loop {
        tokio::select! {
            conn = listener.accept() => {
                let app = app.clone();
                let (stream, _addr) = match conn {
                    Ok(conn) => conn,
                    Err(e) => {
                        eprintln!("accept error: {}", e);
                        tokio::time::sleep(Duration::from_secs(1)).await;
                        continue;
                    }
                };

                let stream = hyper_util::rt::TokioIo::new(Box::pin(stream));


                let conn = server.serve_connection_with_upgrades(stream, hyper::service::service_fn(move |req: Request<Incoming>| handle_request(req, app.clone())));

                tokio::spawn(graceful.watch(conn.into_owned()));
            },

            _ = ctrl_c.as_mut() => {
                eprintln!("\n\x1b[31mCtrl-C foi pressionado! Encerrando aplicação...\x1b[0m");
                    break;
            }
        }
    }

    tokio::select! {
        _ = graceful.shutdown() => {
            eprintln!("Conexões finalizadas, encerrando...");
        },
        _ = countdown("Aguardando conexões serem finalizadas...", 10) => {
            eprintln!("Tempo limite de espera atingido! Forçando encerramento...");
        }
    }

    Ok(())
}

async fn handle_request(
    req: Request<Incoming>,
    app: App,
) -> Result<http::Response<http_body_util::Full<Bytes>>, Infallible> {
    match *req.method() {
        Method::GET => match req.uri().path().trim_matches('/') {
            "importmap.json" => resolve_importmap(req, app).await,
            "importmap.js" => resolve_importmap_js(req, app).await,
            _ => resolve_static(req, app).await,
        },
        Method::POST => resolve_invoke(req, app).await,
        _ => method_not_allowed(),
    }
}

fn method_not_allowed() -> Result<http::Response<http_body_util::Full<Bytes>>, Infallible> {
    Ok(http::Response::builder()
        .status(405)
        .body("Method Not Allowed".into())
        .unwrap())
}

async fn resolve_static(
    req: Request<Incoming>,
    app: App,
) -> Result<http::Response<http_body_util::Full<Bytes>>, Infallible> {
    let path = req.uri().path();
    let file_path = app.static_files.read().await.resolve(path);

    let response = create_response();

    if let Some(file_path) = file_path {
        match tokio::fs::read(&file_path).await {
            Ok(file) => {
                let mime = mime_guess::from_path(&file_path).first_or_octet_stream();
                Ok(response
                    .header("Content-Type", mime.to_string())
                    .body(http_body_util::Full::<Bytes>::from(file))
                    .unwrap())
            }
            Err(e) => {
                eprintln!("Error reading file: {}", e);
                Ok(response
                    .status(500)
                    .body("Internal Server Error".into())
                    .unwrap())
            }
        }
    } else {
        Ok(response.status(404).body("Not Found".into()).unwrap())
    }
}

async fn resolve_invoke(
    req: Request<Incoming>,
    app: App,
) -> Result<http::Response<http_body_util::Full<Bytes>>, Infallible> {
    let request = match get_invoke_request(req).await {
        Some(request) => request,
        None => {
            return Ok(create_response()
                .status(400)
                .body("Bad Request".into())
                .unwrap())
        }
    };
    let result = app.invoke_handlers.read().await.invoke(request).await;

    let response = create_response()
        .status(200)
        .header("X-Invoke-Result", result.label());

    match result {
        InvokeResult::Void => Ok(response.body("".into()).unwrap()),
        InvokeResult::Text(text) => Ok(response
            .header("Content-Type", "text/plain")
            .body(text.into())
            .unwrap()),
        InvokeResult::Json(json) => Ok(response
            .header("Content-Type", "application/json")
            .body(serde_json::to_string(&json).unwrap().into())
            .unwrap()),
        InvokeResult::Binary(bytes) => Ok(response.body(bytes.into()).unwrap()),
        InvokeResult::Error(message) => Ok(response
            .header("Content-Type", "text/plain")
            .body(message.into())
            .unwrap()),
    }
}

async fn resolve_importmap(
    req: Request<Incoming>,
    app: App,
) -> Result<http::Response<http_body_util::Full<Bytes>>, Infallible> {
    let importmap = app.get_importmap().await;
    // Not implemented
    Ok(create_response()
        .status(200)
        .header("Content-Type", "application/json")
        .body(Full::new(Bytes::from(
            serde_json::to_string_pretty(&importmap).unwrap(),
        )))
        .unwrap())
}

async fn resolve_importmap_js(
    req: Request<Incoming>,
    app: App,
) -> Result<http::Response<http_body_util::Full<Bytes>>, Infallible> {
    let importmap = app.get_importmap().await;

    Ok(create_response()
        .header("Content-Type", "application/javascript")
        .body(Full::new(Bytes::from(
            include_str!("./scripts/importmap.js")
                .replace("$IMPORTS$", &serde_json::to_string(&importmap).unwrap()),
        )))
        .unwrap())
}
