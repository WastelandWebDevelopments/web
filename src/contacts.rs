use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use time::OffsetDateTime;

#[derive(Serialize)]
pub struct Contact {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub message: String,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
}

#[derive(Deserialize)]
pub struct CreateContact {
    pub name: String,
    pub email: String,
    pub message: String,
}

pub async fn create(
    State(pool): State<PgPool>,
    Json(body): Json<CreateContact>,
) -> impl IntoResponse {
    let result = sqlx::query_as!(
        Contact,
        "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)
         RETURNING id, name, email, message, created_at",
        body.name,
        body.email,
        body.message,
    )
    .fetch_one(&pool)
    .await;

    match result {
        Ok(contact) => (StatusCode::CREATED, Json(contact)).into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub async fn list(State(pool): State<PgPool>) -> impl IntoResponse {
    let result = sqlx::query_as!(
        Contact,
        "SELECT id, name, email, message, created_at FROM contacts ORDER BY created_at DESC"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(contacts) => Json(contacts).into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}

pub async fn get_one(
    State(pool): State<PgPool>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let result = sqlx::query_as!(
        Contact,
        "SELECT id, name, email, message, created_at FROM contacts WHERE id = $1",
        id
    )
    .fetch_optional(&pool)
    .await;

    match result {
        Ok(Some(contact)) => Json(contact).into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR.into_response(),
    }
}
