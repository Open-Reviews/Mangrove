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
use std::collections::{HashSet, BTreeMap};

#[openapi(skip)]
#[get("/")]
fn index() -> &'static str {
    "Check out for project information: https://planting.space/mangrove.html"
}

#[openapi]
#[put("/submit", format = "application/json", data = "<review>")]
fn submit_review_json(conn: DbConn, review: Json<Review>) -> Result<String, Error> {
    info!("Review received: {:?}", review);
    review.check_signature(&serde_cbor::to_vec(&review.payload)?).map_err(|e| {
        info!("{:?}", e);
        e
    })?;
    review.payload.check(&conn)?;
    conn.insert(review.into_inner())?;
    info!("Review checked and inserted.");
    Ok("true".into())
}

#[derive(Debug, Deserialize, JsonSchema)]
pub struct CborReview {
    /// base64url encoded signature.
    pub signature: String,
    /// CBOR base64url encoded payload.
    pub payload: String
}

#[openapi(skip)]
#[put("/submit", format = "application/cbor", data = "<creview>")]
fn submit_review_cbor(conn: DbConn, creview: Json<CborReview>) -> Result<String, Error> {
    info!("CBOR review received: {:?}", creview);
    let payload_bytes = base64_url::decode(&creview.payload)?;
    let review = Review {
        signature: creview.into_inner().signature,
        payload: serde_cbor::from_slice(&payload_bytes)?
    };
    review.check_signature(&payload_bytes).map_err(|e| {
        info!("{:?}", e);
        e
    })?;
    info!("Review decoded: {:?}", review);
    review.payload.check(&conn)?;
    conn.insert(review)?;
    info!("Review checked and inserted.");
    Ok("true".into())
}

#[derive(Debug, Serialize, JsonSchema)]
struct Reviews {
    reviews: Vec<Review>,
    issuers: Option<Issuers>,
    maresi_subjects: Option<Subjects>,
}

#[openapi]
#[get("/reviews?<json..>")]
fn get_reviews(conn: DbConn, json: Form<Query>) -> Result<Json<Reviews>, Error> {
    let query = json.into_inner();
    let add_issuers = query.issuers.unwrap_or(false);
    let add_subjects = query.maresi_subjects.unwrap_or(false);
    let reviews = conn.filter(query)?;
    let out = Reviews {
        issuers: if add_issuers {
            Some(Issuer::compute_bulk(
                &conn,
                reviews
                    .iter()
                    .map(|review| review.payload.iss.clone())
                    // Deduplicate before computing Issuers.
                    .collect::<HashSet<_>>()
                    .into_iter(),
            )?)
        } else {
            None
        },
        maresi_subjects: if add_subjects {
            Some(Subject::compute_bulk(
                &conn,
                reviews
                    .iter()
                    .map(|review| format!("urn:maresi:{}", review.signature.clone()))
                    // Deduplicate before computing Subjects.
                    .collect::<HashSet<_>>()
                    .into_iter(),
            )?)
        } else {
            None
        },
        reviews,
    };
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

#[derive(Debug, Deserialize, JsonSchema)]
struct BatchQuery {
    subs: Option<Vec<String>>,
    isss: Option<Vec<String>>,
}

type Subjects = BTreeMap<String, Subject>;
type Issuers = BTreeMap<String, Issuer>;

#[derive(Debug, Serialize, JsonSchema)]
struct BatchReturn {
    #[serde(skip_serializing_if = "Option::is_none")]
    subjects: Option<Subjects>,
    #[serde(skip_serializing_if = "Option::is_none")]
    issuers: Option<Issuers>,
}

#[openapi]
#[post("/batch", format = "application/json", data = "<json>")]
fn batch(conn: DbConn, json: Json<BatchQuery>) -> Result<Json<BatchReturn>, Error> {
    let query = json.into_inner();
    info!("Batch request made: {:?}", query);
    let subjects = match &query.subs {
        Some(subs) => Some(Subject::compute_bulk(&conn, subs.iter().cloned())?),
        None => None,
    };
    let issuers = match query.isss {
        Some(subs) => Some(Issuer::compute_bulk(&conn, subs.into_iter())?),
        None => None,
    };
    info!("Returning batch of subjects and issuers: {:?} {:?}", subjects, issuers);
    Ok(Json(BatchReturn { subjects, issuers }))
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
                submit_review_json,
                submit_review_cbor,
                get_reviews,
                get_subject,
                get_issuer,
                batch
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
