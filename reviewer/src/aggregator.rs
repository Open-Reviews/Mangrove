use super::database::{DbConn, Query};
use super::error::Error;
use super::review::MAX_RATING;
use schemars::JsonSchema;
use serde::Serialize;
use std::collections::BTreeMap;

pub trait Statistic {
    fn compute(conn: &DbConn, identifier: String) -> Result<Self, Error>
    where
        Self: Sized;
    fn compute_bulk(
        conn: &DbConn,
        identifiers: impl Iterator<Item = String>,
    ) -> Result<BTreeMap<String, Self>, Error>
    where
        Self: Sized,
    {
        identifiers
            .map(|identifier| {
                Self::compute(&conn, identifier.clone()).map(|statistic| (identifier, statistic))
            })
            .collect()
    }
}

/// Information about a subject of reviews.
#[derive(Debug, Serialize, JsonSchema)]
pub struct Subject {
    pub sub: String,
    pub quality: Option<usize>,
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
        let mut positive = relevant
            .iter()
            .filter(|review| review.payload.rating.unwrap_or(0) > MAX_RATING / 2);
        let positive_count = positive.by_ref().count();
        let confirmed_count = positive
            .filter(|review| {
                review
                    .payload
                    .metadata
                    .as_ref()
                    .map_or(false, |m| m.get("is_personal_experience").is_some())
            })
            .count();
        let rated_count = relevant
            .iter()
            .filter(|review| review.payload.rating.is_some())
            .count();
        let quality = if rated_count == 0 {
            None
        } else {
            Some(
                relevant
                    .iter()
                    .map(|review| review.payload.rating.unwrap_or(0) as usize)
                    .sum::<usize>()
                    / rated_count,
            )
        };
        Ok(Subject {
            sub,
            quality,
            count: relevant.len(),
            positive_count,
            confirmed_count,
        })
    }
}

/// Information about a review issuer.
#[derive(Debug, Serialize, JsonSchema)]
pub struct Issuer {
    /// Number of reviews written by this issuer.
    pub count: usize,
}

impl Statistic for Issuer {
    fn compute(conn: &DbConn, iss: String) -> Result<Self, Error> {
        // TODO: Optimize it by counting closer to DB.
        let count = conn
            .filter(Query {
                iss: Some(iss),
                ..Default::default()
            })?
            .len();
        info!("Returning count {:?}", count);
        Ok(Issuer { count })
    }
}
