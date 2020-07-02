use super::aggregator::{Issuer, Statistic, Subject};
use super::database::{DbConn, Query};
use super::review::Review;
use super::error::Error;
use rocket::request::Form;
use serde::Serialize;
use std::collections::{HashSet, BTreeMap};

pub type Subjects = BTreeMap<String, Subject>;
pub type Issuers = BTreeMap<String, Issuer>;

/// Return type used to provide `Review`s and any associated data.
#[derive(Debug, Serialize)]
pub struct Reviews {
    /// A list of reviews satisfying the `Query`.
    pub reviews: Vec<Review>,
    /// A map from public keys to information about issuers.
    issuers: Option<Issuers>,
    /// A map from Review identifiers (`urn:maresi:<signature>`)
    /// to information about the reviews of that review.
    maresi_subjects: Option<Subjects>,
}

pub fn get_reviews(conn: DbConn, json: Form<Query>) -> Result<Reviews, Error> {
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