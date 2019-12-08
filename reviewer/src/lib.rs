#![feature(proc_macro_hygiene, decl_macro)]

pub mod aggregator;
pub mod database;
pub mod error;
pub mod review;
pub mod schema;

#[macro_use]
extern crate log;
#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;
#[macro_use]
extern crate rocket_okapi;

use self::aggregator::{Issuer, Statistic, Subject};
use self::database::{DbConn, Query};
use self::error::Error;
use self::review::Review;
use rocket::http::Method;
use rocket::request::Form;
use rocket::Rocket;
use rocket_contrib::json::Json;
use rocket_okapi::swagger_ui::{make_swagger_ui, SwaggerUIConfig};
use serde::{Deserialize, Serialize};

#[openapi(skip)]
#[get("/")]
fn index() -> &'static str {
    "Check out for project information: https://planting.space/mangrove.html"
}

#[openapi]
#[put("/submit", format = "application/json", data = "<review>")]
fn submit_review(conn: DbConn, review: Json<Review>) -> Result<String, Error> {
    info!("Review received: {:?}", review);
    review.check(&conn)?;
    conn.insert(review.into_inner())?;
    info!("Review checked and inserted.");
    Ok("true".into())
}

#[openapi]
#[get("/reviews?<query..>")]
fn get_reviews(conn: DbConn, query: Form<Query>) -> Result<Json<Vec<Review>>, Error> {
    let out = conn.filter(query.into_inner())?;
    info!("Returning {:?}", out);
    Ok(Json(out))
}

#[openapi]
#[get("/subject/<sub>")]
fn get_subject(conn: DbConn, sub: String) -> Result<Json<Subject>, Error> {
    Subject::compute(&conn, sub).map(Json)
}

/// Get information on issuers that have left reviews fulfilling the `Query`.
#[openapi]
#[get("/issuer/<iss>")]
fn get_issuer(conn: DbConn, iss: String) -> Result<Json<Issuer>, Error> {
    Issuer::compute(&conn, iss).map(Json)
}

#[serde(rename_all = "lowercase")]
#[derive(Debug, Deserialize, JsonSchema)]
enum BulkQuery {
    Subjects(Vec<String>),
    Issuers(Vec<String>),
}

#[serde(rename_all = "lowercase", untagged)]
#[derive(Debug, Serialize, JsonSchema)]
enum BulkReturn {
    Subjects(Vec<Subject>),
    Issuers(Vec<Issuer>),
}

#[openapi]
#[post("/bulk", format = "application/json", data = "<query>")]
fn bulk(conn: DbConn, query: Json<BulkQuery>) -> Result<Json<BulkReturn>, Error> {
    match query.into_inner() {
        BulkQuery::Subjects(subs) => subs
            .iter()
            .map(|sub| Subject::compute(&conn, sub.into()))
            .collect::<Result<_, _>>()
            .map(BulkReturn::Subjects)
            .map(Json),
        BulkQuery::Issuers(isss) => isss
            .iter()
            .map(|iss| Issuer::compute(&conn, iss.into()))
            .collect::<Result<_, _>>()
            .map(BulkReturn::Issuers)
            .map(Json),
    }
}

pub fn rocket() -> Rocket {
    let cors = rocket_cors::CorsOptions {
        allowed_methods: vec![Method::Put, Method::Get, Method::Post]
            .into_iter()
            .map(From::from)
            .collect(),
        ..Default::default()
    }
    .to_cors()
    .expect("CORS configuration correct.");

    rocket::ignite()
        .attach(DbConn::fairing())
        .mount(
            "/",
            routes_with_openapi![
                index,
                submit_review,
                get_reviews,
                get_subject,
                get_issuer,
                bulk
            ],
        )
        .mount(
            "/swagger-ui/",
            make_swagger_ui(&SwaggerUIConfig {
                url: Some("../openapi.json".to_owned()),
                urls: None,
            }),
        )
        .attach(cors)
}
