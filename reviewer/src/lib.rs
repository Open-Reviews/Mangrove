#![feature(proc_macro_hygiene, decl_macro)]

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

use rocket::Rocket;
use rocket::http::Method;
use rocket::request::Form;
use rocket_contrib::json::Json;
use self::database::{DbConn, Query};
use self::error::Error;
use self::review::Review;

#[get("/")]
fn index() -> &'static str {
    "Check out for project information: https://planting.space/mangrove.html"
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

pub fn rocket() -> Rocket {
    let cors = rocket_cors::CorsOptions {
        allowed_methods: vec![Method::Put, Method::Get]
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
            routes![index, submit_review, request_reviews],
        )
        .attach(cors)
}
