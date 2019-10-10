#![feature(proc_macro_hygiene, decl_macro)]

pub mod schema;
pub mod review;

#[macro_use] extern crate log;
extern crate rand;
extern crate serde;
extern crate serde_json;
extern crate hex;
extern crate untrusted;
extern crate ring;
extern crate xmltree;
extern crate reqwest;
extern crate dotenv;
extern crate url;
#[macro_use] extern crate diesel;
#[macro_use] extern crate rocket;
#[macro_use] extern crate rocket_contrib;

use std::path::{Path, PathBuf};
use diesel::prelude::*;
use diesel::sql_types::Bool;
use rocket::request::Form;
use rocket::response::NamedFile;
use rocket_contrib::json::Json;
use self::review::Review;

#[database("pg_reviews")]
struct DbConn(diesel::PgConnection);

#[get("/")]
fn index() -> NamedFile {
    NamedFile::open("client/dist/index.html").expect("Index file is always present.")
}

#[get("/<file..>", rank = 6)]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("client/dist/").join(file)).ok()
}

#[derive(Debug, Responder)]
enum Error {
    #[response(status = 400)]
    Verification(String),
    #[response(status = 500)]
    Database(String),
}

#[put("/submit", format = "application/json", data = "<review>")]
fn submit_review(conn: DbConn, review: Json<Review>) -> Result<String, Error> {
    info!("Review received: {:?}", review);
    review.verify().map_err(Error::Verification)?;
    diesel::insert_into(schema::reviews::table)
        .values(review.into_inner())
        .execute(&conn.0)
        .map_err(|e| Error::Database(e.to_string()))?;
    info!("Review checked and inserted.");
    Ok("true".into())
}

/// TODO: reconcile with Review, allow metadata and extradata
#[derive(Debug, FromForm)]
struct Query {
    pub signature: Option<String>,
    pub version: Option<i16>,
    pub publickey: Option<String>,
    pub timestamp: Option<i64>,
    pub idtype: Option<String>,
    pub id: Option<String>,
    pub rating: Option<i16>,
    pub opinion: Option<String>,
}

#[get("/request?<query..>")]
fn request_reviews(conn: DbConn, query: Form<Query>) -> Result<Json<Vec<Review>>, Error> {
  use schema::reviews::dsl::*;

  info!("Reviews requested for query {:?}", query);
    let always_true = Box::new(signature.eq(signature));
    let mut f: Box<dyn BoxableExpression<schema::reviews::table, _, SqlType = Bool>> = always_true;
    if let Some(s) = &query.signature { f = Box::new(f.and(signature.eq(s))) }
    if let Some(s) = &query.version { f = Box::new(f.and(version.eq(s))) }
    if let Some(s) = &query.publickey { f = Box::new(f.and(publickey.eq(s))) }
    if let Some(s) = &query.timestamp { f = Box::new(f.and(timestamp.eq(s))) }
    if let Some(s) = &query.id {
        query
            .idtype
            .as_ref()
            .ok_or_else(|| Error::Verification("Id request requires idtype.".into()))?;
        f = Box::new(f.and(id.eq(s)));
    } else if let Some(s) = &query.idtype { f = Box::new(f.and(idtype.eq(s))) }
    if let Some(s) = &query.rating { f = Box::new(f.and(rating.eq(s))) }
    if let Some(s) = &query.opinion { f = Box::new(f.and(opinion.eq(s))) }
    let out = reviews.filter(f).load::<Review>(&conn.0).map_err(|e| Error::Database(e.to_string()))?;
    info!("Returning {:?}", out);
    Ok(Json(out))
}

fn main() {
    rocket::ignite()
        .attach(DbConn::fairing())
        .mount("/", routes![index, files, submit_review, request_reviews])
        .launch();
}
