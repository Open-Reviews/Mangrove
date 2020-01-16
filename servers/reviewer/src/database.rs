use super::error::Error;
use super::review::Review;
use super::schema;
use diesel::prelude::*;
use diesel::sql_types::Bool;
use schemars::JsonSchema;

#[database("pg_reviews")]
pub struct DbConn(diesel::PgConnection);

/// Query data used to specify which reviews should be returned.
/// Review fulfills the query if all conditions are satisfied (intersection).
#[derive(Default, Debug, FromForm, JsonSchema)]
pub struct Query {
    /// Search for reviews with this string in `sub` and `opinion` fields.
    pub q: Option<String>,
    /// Return review with this `signature` value.
    pub signature: Option<String>,
    /// Return reviews by this issuer.
    pub iss: Option<String>,
    /// Return reviews issued at this time.
    pub iat: Option<i64>,
    /// Return reviews with timestamp greater than this.
    pub gt_iat: Option<i64>,
    /// Return reviews with the given subject.
    pub sub: Option<String>,
    /// Return reviews with the given rating.
    pub rating: Option<i16>,
    /// Return reviews with the given opinion.
    pub opinion: Option<String>,
    /// Include aggregate information about review issuers.
    pub issuers: Option<bool>,
    /// Include aggregate information about reviews of returned reviews.
    pub maresi_subjects: Option<bool>,
}

impl DbConn {
    pub fn insert(&self, review: Review) -> Result<(), Error> {
        diesel::insert_into(schema::reviews::table)
            .values(review)
            .execute(&self.0)?;
        Ok(())
    }

    pub fn filter(&self, query: Query) -> Result<Vec<Review>, Error> {
        use schema::reviews::dsl::*;

        info!("Reviews requested for query {:?}", query);
        let always_true = Box::new(signature.eq(signature));
        let mut f: Box<dyn BoxableExpression<schema::reviews::table, _, SqlType = Bool>> =
            always_true;
        if let Some(s) = &query.signature {
            f = Box::new(f.and(signature.eq(s)))
        }
        if let Some(s) = &query.iss {
            f = Box::new(f.and(iss.eq(s)))
        }
        if let Some(s) = &query.iat {
            f = Box::new(f.and(iat.eq(s)))
        }
        if let Some(s) = &query.gt_iat {
            f = Box::new(f.and(iat.gt(s)))
        }
        // Allow prefix match.
        if let Some(s) = &query.sub {
            f = Box::new(f.and(sub.eq(s)))
        }
        if let Some(s) = &query.rating {
            f = Box::new(f.and(rating.eq(s)))
        }
        if let Some(s) = &query.opinion {
            f = Box::new(f.and(opinion.eq(s)))
        }
        if let Some(s) = &query.q {
            if !s.is_empty() {
                let pattern = format!("%{}%", s);
                f = Box::new(f.and(sub.like(pattern.clone()).or(opinion.like(pattern))))
            }
        }
        Ok(reviews.filter(f).select((signature, (iss, iat, sub, rating, opinion, extra_hashes, metadata))).load::<Review>(&self.0)?)
    }

    pub fn select(&self, sig: &str) -> Result<Review, Error> {
        use schema::reviews::dsl::*;

        schema::reviews::table
            .filter(signature.eq(sig))
            .select((signature, (iss, iat, sub, rating, opinion, extra_hashes, metadata)))
            .load::<Review>(&self.0)?
            .into_iter()
            .next()
            .ok_or_else(|| Error::Incorrect(format!("No review found with MaReSi: {}", sig)))
    }
}
