#![feature(proc_macro_hygiene, decl_macro)]

pub mod database;
pub mod error;
pub mod review;
pub mod schema;

#[macro_use]
extern crate log;
extern crate dotenv;
extern crate hex;
extern crate rand;
extern crate reqwest;
extern crate ring;
extern crate serde;
extern crate serde_json;
extern crate untrusted;
extern crate url;
extern crate xmltree;
#[macro_use]
extern crate diesel;
#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;

use self::database::{DbConn, Query};
use self::error::Error;
use self::review::Review;
use rocket::request::Form;
use rocket::response::NamedFile;
use rocket_contrib::json::Json;
use std::path::{Path, PathBuf};

#[get("/")]
fn index() -> NamedFile {
    NamedFile::open("client/dist/index.html").expect("Index file is always present.")
}

#[get("/<file..>", rank = 6)]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("client/dist/").join(file)).ok()
}

#[put("/submit", format = "application/json", data = "<review>")]
fn submit_review(conn: DbConn, review: Json<Review>) -> Result<String, Error> {
    info!("Review received: {:?}", review);
    review.check(&conn)?;
    conn.insert(review.into_inner())?;
    info!("Review checked and inserted.");
    Ok("true".into())
}

#[get("/request?<query..>")]
fn request_reviews(conn: DbConn, query: Form<Query>) -> Result<Json<Vec<Review>>, Error> {
    let out = conn.filter(query.into_inner())?;
    info!("Returning {:?}", out);
    Ok(Json(out))
}

fn main() {
    rocket::ignite()
        .attach(DbConn::fairing())
        .mount("/", routes![index, files, submit_review, request_reviews])
        .launch();
}
