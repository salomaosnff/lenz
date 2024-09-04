use core::str;

use app::AppState;
use lenz_core::invoke::{InvokeRequest, InvokeResult};

mod server;
mod app;
mod paths;
mod state;


#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let app = AppState::new();

    state::extensions::init(app.clone()).await;

    server::start(app).await?;

    Ok(())
}
