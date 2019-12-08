use super::database::{DbConn, Query};
use super::error::Error;
use super::review::MAX_RATING;
use schemars::JsonSchema;
use serde::Serialize;

pub trait Statistic {
    fn compute(conn: &DbConn, identifier: String) -> Result<Self, Error>
    where
        Self: Sized;
}

/// Information about a subject of reviews.
#[derive(Debug, Serialize, JsonSchema)]
pub struct Subject {
    pub sub: String,
    pub quality: usize,
    /// Number of reviews given to this subject.
    pub count: usize,
    /// Number of reviews with rating above 50 given to this subject.
    pub positive_count: usize,
    /// Number of reviews with rating above 50 and `is_personal_experience` flag given to this subject.
    pub confirmed_count: usize,
}

impl Statistic for Subject {
    fn compute(conn: &DbConn, sub: String) -> Result<Self, Error> {
        let relevant = conn.filter(Query {
            sub: Some(sub.clone()),
            ..Default::default()
        })?;
        let count = relevant.len();
        let mut positive = relevant
            .iter()
            .filter(|review| review.rating.unwrap_or(0) > MAX_RATING / 2);
        let positive_count = positive.by_ref().count();
        let confirmed_count = positive
            .filter(|review| {
                review
                    .metadata
                    .as_ref()
                    .map_or(false, |m| m.get("is_personal_experience").is_some())
            })
            .count();
        let quality = if count == 0 {
            0
        } else {
            relevant
                .iter()
                .map(|review| review.rating.unwrap_or(0) as usize)
                .sum::<usize>()
                / count
        };
        Ok(Subject {
            sub,
            quality,
            count,
            positive_count,
            confirmed_count,
        })
    }
}

/// Information about a review issuer.
#[derive(Debug, Serialize, JsonSchema)]
pub struct Issuer {
    /// Public key of the issuer.
    pub iss: String,
    /// Number of reviews written by this issuer.
    pub count: usize,
}

impl Statistic for Issuer {
    fn compute(conn: &DbConn, iss: String) -> Result<Self, Error> {
        // TODO: Optimize it by counting closer to DB.
        let count = conn
            .filter(Query {
                iss: Some(iss.clone()),
                ..Default::default()
            })?
            .len();
        info!("Returning count {:?}", count);
        Ok(Issuer { iss, count })
    }
}
