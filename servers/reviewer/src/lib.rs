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
use rocket::response::{Responder, Response};
use rocket::http::{Method, ContentType, Status};
use rocket::request::{Form, Request};
use rocket::Rocket;
use rocket::http::hyper::header::{ContentDisposition, DispositionType, DispositionParam, Charset};
use rocket_contrib::json::Json;
use rocket_okapi::swagger_ui::{make_swagger_ui, SwaggerUIConfig};
use csv::Writer;
use serde::{Deserialize, Serialize};
use std::time::SystemTime;
use std::str::FromStr;
use std::collections::{HashSet, BTreeMap};

#[openapi(skip)]
#[get("/")]
fn index() -> &'static str {
    "Check out for project information: https://planting.space/mangrove.html"
}


#[openapi]
#[put("/submit/<jwt_review>")]
fn submit_review_jwt(conn: DbConn, jwt_review: String) -> Result<String, Error> {
    info!("Review received: {:?}", jwt_review);
    let review = Review::from_str(&jwt_review)?;
    review.validate(&conn)?;
    println!("Inserting review: {:?}", review);
    conn.insert(review)?;
    Ok("true".into())
}

/// Return type used to provide `Review`s and any associated data.
#[derive(Debug, Serialize, JsonSchema)]
struct Reviews {
    /// A list of reviews satisfying the `Query`.
    reviews: Vec<Review>,
    /// A map from public keys to information about issuers.
    issuers: Option<Issuers>,
    /// A map from Review identifiers (`urn:maresi:<signature>`)
    /// to information about the reviews of that review.
    maresi_subjects: Option<Subjects>,
}

fn get_reviews(conn: DbConn, json: Form<Query>) -> Result<Reviews, Error> {
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
                    .map(|review| review.kid.clone())
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
    Ok(out)
}

#[openapi]
#[get("/reviews?<json..>", format = "application/json")]
fn get_reviews_json(conn: DbConn, json: Form<Query>) -> Result<Json<Reviews>, Error> {
    get_reviews(conn, json).map(Json)
}

#[derive(Debug)]
struct Csv(String);

impl Responder<'static> for Csv {
    fn respond_to(self, _: &Request) -> Result<Response<'static>, Status> {
        let unix_time = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .ok()
            .map(|t| t.as_secs())
            .map_or("unknown".into(), |n| n.to_string());
        Response::build()
            .header(ContentType::CSV)
            .header(ContentDisposition {
                disposition: DispositionType::Attachment,
                parameters: vec![DispositionParam::Filename(
                Charset::Iso_8859_1, // The character set for the bytes of the filename
                None, // The optional language tag
                format!("mangrove.reviews_{}.csv", unix_time)
                    .into_bytes() // the actual bytes of the filename
                )]
            })
            .sized_body(std::io::Cursor::new(self.0))
            .ok()
    }
}

/// Csv serde serialization does not support maps...
#[openapi(skip)]
#[get("/reviews?<json..>", rank = 2)] //format = "text/csv"
fn get_reviews_csv(conn: DbConn, json: Form<Query>) -> Result<Csv, Error> {
    let out = get_reviews(conn, json)?;
    let mut wtr = Writer::from_writer(vec![]);
    wtr.write_record(&["signature", "pem", "iat", "sub", "rating", "opinion", "images", "metadata"])?;
    for review in out.reviews {
        let pl = review.payload;
        wtr.write_record(&[
            review.signature,
            review.kid,
            pl.iat.to_string(),
            pl.sub,
            pl.rating.map_or("none".into(), |r| r.to_string()),
            pl.opinion.unwrap_or("none".into()),
            pl.images.map_or("none".into(), |eh| eh.to_string()),
            pl.metadata.map_or("none".into(), |m| m.to_string())
        ])?;
    }
    Ok(Csv(String::from_utf8(wtr.into_inner()?)?))
}

#[openapi]
#[get("/subject/<sub>")]
fn get_subject(conn: DbConn, sub: String) -> Result<Json<Subject>, Error> {
    Subject::compute(&conn, sub).map(Json)
}

/// Get information on issuers that have left reviews fulfilling the `Query`.
#[openapi]
#[get("/issuer/<pem>")]
fn get_issuer(conn: DbConn, pem: String) -> Result<Json<Issuer>, Error> {
    Issuer::compute(&conn, pem).map(Json)
}

/// Query allowing for retrieval of information about multiple subjects or issuers.
#[derive(Debug, Deserialize, JsonSchema)]
struct BatchQuery {
    /// List of subject URIs to get information about.
    subs: Option<Vec<String>>,
    /// List of issuer public keys to get information about.
    pems: Option<Vec<String>>,
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
    let issuers = match query.pems {
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
                submit_review_jwt,
                get_reviews_json,
                get_reviews_csv,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[ignore]
    fn requiring_api() {
        use reqwest::header::CONTENT_TYPE;
        let client = reqwest::Client::new();
        let out: String = client
            .put("http://localhost:8000/submit")
            .header(CONTENT_TYPE, "application/cbor")
            .body(r#"
                {"signature":"9tK0nToEjPstvi3plrTa2EusKcPgIdSc_RF8fFXwUKBGhO5XjjJ43mDY_sp0FOvd","payload":"pWdvcGluaW9ueKVUaGlzIGRvbWFpbiBoYXMgYmVlbiByYW5rZWQgMSBvZiAxMCBtaWxsaW9uIHdpdGggT3BlbiBQYWdlUmFuayAxMC4wLgoKU291cmNlOiBodHRwczovL3d3dy5kb21jb3AuY29tL29wZW5wYWdlcmFuay93aGF0LWlzLW9wZW5wYWdlcmFuaywgcmV0cmlldmVkIG9uIDI5IE5vdmVtYmVyIDIwMTljc3VieBxodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tY2lhdDqh8KTVY2lzc3hAUVpRQmVJN29ISHFaNU5jaWtNNmdaYks0WkFWMHJINDdxRUI4MUFWdVl0dTRDaG9yV19vYUdlSUphRFh6cUN1d2htZXRhZGF0YaNsZGlzcGxheV9uYW1lbE1hbmdyb3ZlIEJvdGtkYXRhX3NvdXJjZXg4aHR0cHM6Ly93d3cuZG9tY29wLmNvbS9vcGVucGFnZXJhbmsvd2hhdC1pcy1vcGVucGFnZXJhbmtsaXNfZ2VuZXJhdGVk9Q"}
            "#)
            .send()
            .unwrap()
            .text()
            .unwrap();
            //.parse()
            //.unwrap();
        println!("{:?}", out)
        //assert!(out)
    }
}

