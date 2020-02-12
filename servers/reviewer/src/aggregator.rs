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
    /// URI uniquely identifying the subject.
    pub sub: String,
    /// Aggregate number representing quality of the subject.
    pub quality: Option<i16>,
    /// Number of reviews given to this subject.
    pub count: usize,
    /// Number of reviews which included an opinion.
    pub opinion_count: usize,
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
        let mut count = 0;
        let mut rated_count = 0;
        let mut rating_total = 0;
        let mut opinion_count = 0;
        let mut positive_count = 0;
        let mut confirmed_count = 0;
        for review in relevant {
            count += 1;
            if let Some(rating) = review.payload.rating {
                rated_count += 1;
                rating_total += rating;
                if rating > MAX_RATING / 2 {
                    positive_count += 1;
                    if let Some(metadata) = review.payload.metadata {
                        if metadata.get("is_personal_experience").is_some() {
                            confirmed_count += 1;
                        }
                    }
                }
            }
            if review.payload.opinion.is_some() {
                opinion_count += 1;
            }
        }
        let quality = match rated_count {
            0 => None,
            _ => Some(rating_total / rated_count)
        };
        Ok(Subject {
            sub,
            quality,
            count,
            opinion_count,
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
    fn compute(conn: &DbConn, kid: String) -> Result<Self, Error> {
        // TODO: Optimize it by counting closer to DB.
        let count = conn
            .filter(Query {
                kid: Some(kid),
                ..Default::default()
            })?
            .len();
        println!("Returning count {:?}", count);
        Ok(Issuer { count })
    }
}
