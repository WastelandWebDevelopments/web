mod contacts;

use axum::{Router, routing::{get, post}, http::StatusCode};
use sqlx::postgres::PgPoolOptions;
use tower_http::services::ServeDir;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("failed to connect to database");

    println!("database connected");

    let app = Router::new()
        .route("/healthz", get(|| async { StatusCode::OK }))
        .route("/api/contacts", post(contacts::create).get(contacts::list))
        .route("/api/contacts/{id}", get(contacts::get_one))
        .fallback_service(ServeDir::new("public"))
        .with_state(pool);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
