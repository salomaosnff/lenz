use app::AppState;

mod app;
mod browser;
mod server;
mod state;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let app = AppState::new();

    state::extensions::init(app.clone()).await;

    server::start(app.clone()).await?;

    state::extensions::shutdown(app.clone()).await;

    Ok(())
}