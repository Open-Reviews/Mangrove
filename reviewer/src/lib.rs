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
use rocket::outcome::Outcome::{Success, Failure};
use rocket::http::{Method, Status};
use rocket::request::{Form, Request};
use rocket::data::{FromData, Data, Transformed, Transform, Outcome};
use rocket::Rocket;
use rocket_contrib::json::Json;
use rocket_okapi::swagger_ui::{make_swagger_ui, SwaggerUIConfig};
use serde::{Deserialize, Serialize};
use std::collections::{HashSet, BTreeMap};
use std::io::Read;
use std::ops::Deref;

#[openapi(skip)]
#[get("/")]
fn index() -> &'static str {
    "Check out for project information: https://planting.space/mangrove.html"
}

#[openapi]
#[put("/submit", format = "application/json", data = "<review>")]
fn submit_review_json(conn: DbConn, review: Json<Review>) -> Result<String, Error> {
    info!("Review received: {:?}", review);
    review.check(&conn)?;
    conn.insert(review.into_inner())?;
    info!("Review checked and inserted.");
    Ok("true".into())
}

#[derive(Debug)]
pub struct ReviewCbor(pub Review);

impl ReviewCbor {
    /// Consumes the CBOR wrapper and returns the wrapped item.
    #[inline(always)]
    pub fn into_inner(self) -> Review {
        self.0
    }
}

/// Default limit for CBOR is 1MB.
const LIMIT: u64 = 1 << 20;

impl<'a> FromData<'a> for ReviewCbor {
    type Error = Error;
    type Owned = String;
    type Borrowed = str;

    fn transform(r: &Request, d: Data) -> Transform<Outcome<Self::Owned, Self::Error>> {
        let size_limit = r.limits().get("cbor").unwrap_or(LIMIT);
        match serde_cbor::from_reader::<String, _>(d.open().take(size_limit)) {
            Ok(s) => Transform::Borrowed(Success(s)),
            Err(e) => Transform::Borrowed(Failure((Status::BadRequest, e.into())))
        }
    }

    fn from_data(_: &Request, o: Transformed<'a, Self>) -> Outcome<Self, Self::Error> {
        let string = o.borrowed()?;
        match serde_cbor::from_slice(&string.as_bytes()) {
            Ok(v) => Success(ReviewCbor(v)),
            Err(e) => {
                error_!("Couldn't parse JSON body: {:?}", e);
                if e.is_data() {
                    Failure((Status::UnprocessableEntity, e.into()))
                } else {
                    Failure((Status::BadRequest, e.into()))
                }
            }
        }
    }
}

impl Deref for ReviewCbor {
    type Target = Review;

    #[inline(always)]
    fn deref(&self) -> &Review {
        &self.0
    }
}

#[openapi(skip)]
#[put("/submit", format = "application/cbor", data = "<review>")]
fn submit_review_cbor(conn: DbConn, review: ReviewCbor) -> Result<String, Error> {
    info!("Review received: {:?}", review);
    review.check(&conn)?;
    conn.insert(review.into_inner())?;
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
                    .map(|review| review.iss.clone())
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
