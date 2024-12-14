use bytes::Bytes;
use http::{Method, Request};
use http_body_util::Full;
use hyper::body::Incoming;
use lenz_core::config::consts::{ADDR, BASE_URL};
use lenz_core::invoke::InvokeResult;
use mime_guess::mime::{APPLICATION_JSON, APPLICATION_OCTET_STREAM, TEXT_PLAIN_UTF_8};
use std::convert::Infallible;
use std::sync::Arc;
use std::time::Duration;
use tokio::net::TcpListener;

use crate::app::App;
use crate::state::invoke_handlers::get_invoke_request;
use std::pin::pin;

async fn countdown(message: &str, seconds: u32) {
    for i in (1..=seconds).rev() {
        eprint!("\x1b[33m({}s) {}\x1b[0m", i, message);
        tokio::time::sleep(Duration::from_secs(1)).await;
        eprint!("\x1b[2K\r");
    }
}

pub fn open_browser() {
    let url = match std::env::args().nth(1) {
        // Encode URI component arg
        Some(arg) => &format!("{}?file={}", BASE_URL, urlencoding::encode(&arg)),
        None => BASE_URL,
    };

    crate::browser::open_in_app_mode(url);
}

pub fn create_response() -> http::response::Builder {
    let response = http::Response::builder().header("Access-Control-Allow-Origin", "*");

    return response.header("Access-Control-Expose-Headers", "X-Invoke-Result");
}

pub async fn start(app: App) -> Result<(), Box<dyn std::error::Error>> {
    // Hide cursor
    eprint!("\x1b[?25l");
    
    let listener = match TcpListener::bind(ADDR).await {
        Ok(listener) => listener,
        Err(e) => match e.kind() {
            std::io::ErrorKind::AddrInUse => {
                eprintln!("\x1b[31;1mPorta {} já está em uso.\x1b[0m", ADDR);
                open_browser();
                return Ok(());
            }
            _ => {
                eprintln!("Erro ao iniciar servidor: {}", e);
                return Ok(());
            }
        },
    };

    println!("\x1b[32;1mServidor iniciado em http://{}\x1b[0m", ADDR);

    #[cfg(not(debug_assertions))]
    {
        if std::env::args().all(|arg| arg != "--no-browser") {
            open_browser()
        }
    }

    let server = hyper_util::server::conn::auto::Builder::new(hyper_util::rt::TokioExecutor::new());
    let graceful = hyper_util::server::graceful::GracefulShutdown::new();
    let mut ctrl_c = pin!(tokio::signal::ctrl_c());
    let (quit_tx, mut quit_rx) = tokio::sync::mpsc::channel::<()>(100);
    let quit_tx = Arc::new(tokio::sync::RwLock::new(Some(quit_tx)));

    loop {
        let quit_tx = quit_tx.clone();

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

                let conn = server.serve_connection_with_upgrades(stream, hyper::service::service_fn(move |req: Request<Incoming>| handle_request(req, app.clone(), quit_tx.clone())));

                tokio::spawn(graceful.watch(conn.into_owned()));
            },

            Some(_) = quit_rx.recv() => {
                eprintln!("\r\x1b[2K\x1b[36mUm pedido de encerramento foi recebido, encerrando servidor...\x1b[0m");
                #[cfg(not(debug_assertions))]
                {
                    break;
                }
            },

            _ = ctrl_c.as_mut() => {
                eprintln!("\r\x1b[2K\x1b[36mCtrl-C pressionado, encerrando servidor...\x1b[0m");
                break;
            }
        };
    }

    tokio::select! {
        _ = graceful.shutdown() => {
            eprintln!("\x1b[32mTodas as conexões foram encerradas.\x1b[0m");
        },
        _ = countdown("Aguardando conexões ativas...", 10) => {
            eprintln!("\n\x1b[31mTempo limite atingido, encerrando servidor...\x1b[0m");
        }
    }

    // Show cursor
    eprint!("\x1b[?25h");

    Ok(())
}

async fn handle_request(
    req: Request<Incoming>,
    app: App,
    quit_signal: Arc<tokio::sync::RwLock<Option<tokio::sync::mpsc::Sender<()>>>>,
) -> Result<http::Response<http_body_util::Full<Bytes>>, Infallible> {
    match *req.method() {
        Method::GET => match req.uri().path().trim_matches('/') {
            "importmap.json" => resolve_importmap(req, app).await,
            "lenz-init.js" => resolve_init_script(req, app).await,
            _ => resolve_static(req, app).await,
        },
        Method::POST => resolve_invoke(req, app, quit_signal).await,
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
    quit_signal: Arc<tokio::sync::RwLock<Option<tokio::sync::mpsc::Sender<()>>>>,
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
            .header("Content-Type", TEXT_PLAIN_UTF_8.to_string())
            .body(text.into())
            .unwrap()),
        InvokeResult::Json(json) => Ok(response
            .header("Content-Type", APPLICATION_JSON.to_string())
            .body(serde_json::to_string(&json).unwrap().into())
            .unwrap()),
        InvokeResult::Binary(bytes) => Ok(response
            .header("Content-Type", APPLICATION_OCTET_STREAM.to_string())
            .body(bytes.into())
            .unwrap()),
        InvokeResult::Error(message) => Ok(response
            .header("Content-Type", TEXT_PLAIN_UTF_8.to_string())
            .body(message.into())
            .unwrap()),
        InvokeResult::Quit => {
            if let Some(quit_signal) = quit_signal.write().await.take() {
                quit_signal.send(()).await.ok();
            }

            Ok(response.body("".into()).unwrap())
        }
    }
}

async fn resolve_importmap(
    _req: Request<Incoming>,
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

async fn resolve_init_script(
    _req: Request<Incoming>,
    app: App,
) -> Result<http::Response<http_body_util::Full<Bytes>>, Infallible> {
    let importmap = app.get_importmap().await;
    let extensions = app.extension_host.read().await.get_extensions_json().await;

    Ok(create_response()
        .header("Content-Type", "application/javascript")
        .body(Full::new(Bytes::from(
            include_str!("./scripts/init.js")
                .replace("$IMPORTS$", &serde_json::to_string(&importmap).unwrap())
                .replace("$EXTENSIONS$", &serde_json::to_string(&extensions).unwrap()),
        )))
        .unwrap())
}
