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
use std::collections::{HashSet, BTreeMap};

#[openapi(skip)]
#[get("/")]
fn index() -> &'static str {
    "Check out for project information: https://planting.space/mangrove.html"
}

#[openapi(skip)]
#[put("/submit", format = "application/json", data = "<review>")]
fn submit_review_json(conn: DbConn, review: Json<Review>) -> Result<String, Error> {
    info!("Review received: {:?}", review);
    // Put into a `serde_cbor::Value` to make sure CBOR is canonical.
    let cbor_value = serde_cbor::value::to_value(&review.payload).unwrap();
    review.check_signature(&serde_cbor::to_vec(&cbor_value)?).map_err(|e| {
        info!("{:?}", e);
        e
    })?;
    review.payload.check(&conn)?;
    conn.insert(review.into_inner())?;
    info!("Review checked and inserted.");
    Ok("true".into())
}

/// Just like `Review`, but with `payload` encoded as CBOR instead of JSON.
#[derive(Debug, Deserialize, JsonSchema)]
pub struct CborReview {
    /// ECDSA signature of the `payload` by the review issuer.
    pub signature: String,
    /// CBOR base64url encoded payload.
    pub payload: String
}

/// Submit a review with payload encoded in CBOR,
/// useful for clients that do not have access to Canonical CBOR implementation.
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
    wtr.write_record(&["signature", "iss", "iat", "sub", "rating", "opinion", "extra_hashes", "metadata"])?;
    for review in out.reviews {
        let pl = review.payload;
        wtr.write_record(&[
            review.signature,
            pl.iss,
            pl.iat.to_string(),
            pl.sub,
            pl.rating.map_or("none".into(), |r| r.to_string()),
            pl.opinion.unwrap_or("none".into()),
            pl.extra_hashes.map_or("none".into(), |eh| eh.to_string()),
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
#[get("/issuer/<iss>")]
fn get_issuer(conn: DbConn, iss: String) -> Result<Json<Issuer>, Error> {
    Issuer::compute(&conn, iss).map(Json)
}

/// Query allowing for retrieval of information about multiple subjects or issuers.
#[derive(Debug, Deserialize, JsonSchema)]
struct BatchQuery {
    /// List of subject URIs to get information about.
    subs: Option<Vec<String>>,
    /// List of issuer public keys to get information about.
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

    fn check_signature_cbor(data: &str) {
        let creview: Json<CborReview> = Json(serde_json::from_str(data).unwrap());
        
        let payload_bytes = base64_url::decode(&creview.payload).unwrap();
        //println!("{:?}", serde_cbor::from_slice::<review::Payload>(&payload_bytes).unwrap());
        let review = Review {
            signature: creview.into_inner().signature,
            payload: serde_cbor::from_slice(&payload_bytes).unwrap()
        };
        println!("{:?}", review);
        review.check_signature(&payload_bytes).map_err(|e| {
            e
        }).unwrap();
    }

    #[test]
    fn test_js() {
        check_signature_cbor(r#"
            {
                "signature": "_FK0VsBTZmMlBca6qIg1eow_4LU1PODyZ2v1FRCNARwZlcCS330GO62_7DYjSRwrARBwyVWHSzVlKEcne9Ro0Q",
                "payload": "pWNpc3N4V0JCbUVLWmNpR01vblRfRzBDbWlNNEhkZk02bzBrdHVoM3hJRmFkdmMxVFZnQTBaSlVOSVM2Z28wcFg4andTVW9yYkRmdjI3VF9NOU05d2xkTUZrNnQwMGNpYXQaXg82ZGNzdWJ4KWdlbzo_cT00Ny4xNjkxNTc2LDguNTE0NTcyKEp1YW5pdG9zKSZ1PTMwZnJhdGluZxhLaG1ldGFkYXRhoWpjbGllbnRfdXJpeBhodHRwczovL21hbmdyb3ZlLnJldmlld3M"
            }"#
        )
    }

    #[test]
    fn test_julia() {
        check_signature_cbor(r#"
            {"signature":"9tK0nToEjPstvi3plrTa2EusKcPgIdSc_RF8fFXwUKBGhO5XjjJ43mDY_sp0FOvd","payload":"pWdvcGluaW9ueKVUaGlzIGRvbWFpbiBoYXMgYmVlbiByYW5rZWQgMSBvZiAxMCBtaWxsaW9uIHdpdGggT3BlbiBQYWdlUmFuayAxMC4wLgoKU291cmNlOiBodHRwczovL3d3dy5kb21jb3AuY29tL29wZW5wYWdlcmFuay93aGF0LWlzLW9wZW5wYWdlcmFuaywgcmV0cmlldmVkIG9uIDI5IE5vdmVtYmVyIDIwMTljc3VieBxodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tY2lhdDqh8KTVY2lzc3hAUVpRQmVJN29ISHFaNU5jaWtNNmdaYks0WkFWMHJINDdxRUI4MUFWdVl0dTRDaG9yV19vYUdlSUphRFh6cUN1d2htZXRhZGF0YaNsZGlzcGxheV9uYW1lbE1hbmdyb3ZlIEJvdGtkYXRhX3NvdXJjZXg4aHR0cHM6Ly93d3cuZG9tY29wLmNvbS9vcGVucGFnZXJhbmsvd2hhdC1pcy1vcGVucGFnZXJhbmtsaXNfZ2VuZXJhdGVk9Q"}
        "#
        )
    }

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

