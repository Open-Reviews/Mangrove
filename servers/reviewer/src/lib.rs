#![feature(proc_macro_hygiene, decl_macro)]

pub mod aggregator;
pub mod database;
pub mod error;
pub mod review;
pub mod schema;
pub mod aggregator_schema;

#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;

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
use csv::Writer;
use serde::{Deserialize, Serialize};
use std::time::SystemTime;
use std::str::FromStr;
use std::collections::{HashSet, BTreeMap};

#[get("/")]
fn index() -> &'static str {
    "Check out for project information: https://planting.space/mangrove.html"
}


#[put("/submit/<jwt_review>")]
fn submit_review_jwt(conn: DbConn, jwt_review: String) -> Result<String, Error> {
    println!("Review received: {:?}", jwt_review);
    let review = Review::from_str(&jwt_review)?;
    review.validate_db(&conn)?;
    println!("Inserting review: {:?}", review);
    conn.insert(review)?;
    Ok("true".into())
}

/// Return type used to provide `Review`s and any associated data.
#[derive(Debug, Serialize)]
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
    println!("Reviews requested for query {:?}", query);
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
    println!("Returning {:?}", out);
    Ok(out)
}

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

#[get("/subject/<sub>")]
fn get_subject(conn: DbConn, sub: String) -> Result<Json<Subject>, Error> {
    Subject::compute(&conn, sub).map(Json)
}

/// Get information on issuer with given public key.
#[get("/issuer/<pem>")]
fn get_issuer(conn: DbConn, pem: String) -> Result<Json<Issuer>, Error> {
    Issuer::compute(&conn, pem).map(Json)
}

/// Query allowing for retrieval of information about multiple subjects or issuers.
#[derive(Debug, Deserialize)]
struct BatchQuery {
    /// List of subject URIs to get information about.
    subs: Option<Vec<String>>,
    /// List of issuer public keys to get information about.
    pems: Option<Vec<String>>,
}

type Subjects = BTreeMap<String, Subject>;
type Issuers = BTreeMap<String, Issuer>;

#[derive(Debug, Serialize)]
struct BatchReturn {
    #[serde(skip_serializing_if = "Option::is_none")]
    subjects: Option<Subjects>,
    #[serde(skip_serializing_if = "Option::is_none")]
    issuers: Option<Issuers>,
}

#[post("/batch", format = "application/json", data = "<json>")]
fn batch(conn: DbConn, json: Json<BatchQuery>) -> Result<Json<BatchReturn>, Error> {
    let query = json.into_inner();
    println!("Batch request made: {:?}", query);
    let subjects = match &query.subs {
        Some(subs) => Some(Subject::compute_bulk(&conn, subs.iter().cloned())?),
        None => None,
    };
    let issuers = match query.pems {
        Some(subs) => Some(Issuer::compute_bulk(&conn, subs.into_iter())?),
        None => None,
    };
    println!("Returning batch of subjects and issuers: {:?} {:?}", subjects, issuers);
    Ok(Json(BatchReturn { subjects, issuers }))
}

pub fn rocket() -> Rocket {
    let cors = rocket_cors::CorsOptions {
        allowed_methods: vec![Method::Put, Method::Get, Method::Post, Method::Options]
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
            routes![
                index,
                submit_review_jwt,
                get_reviews_json,
                get_reviews_csv,
                get_subject,
                get_issuer,
                batch
            ],
        )
        .attach(cors)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_columns() {
        use diesel::prelude::*;
        use schema::reviews::dsl::*;
        use diesel::{QueryDsl, ExpressionMethods, pg::Pg};

        let conn = PgConnection::establish(&database_url)
            .expect(&format!("Error connecting to {}", database_url));

        let target = reviews.filter(sub.like("geo:%"));
        //diesel::update(target).set(coordinates.eq(sub)).execute(&conn).unwrap();
        //diesel::update(target).set(uncertainty.eq(sub)).execute(&conn).unwrap();
    }
}
