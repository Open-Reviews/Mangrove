use super::error::Error;
use super::review::{Review, validate_sub};
use super::schema;
use diesel_geography::sql_types::Geography;
use diesel::prelude::*;
use diesel::sql_types::{Nullable, Bool, Integer};

#[database("pg_reviews")]
pub struct DbConn(diesel::PgConnection);

/// Query data used to specify which reviews should be returned.
/// Review fulfills the query if all conditions are satisfied (intersection).
#[derive(Default, Debug, FromForm)]
pub struct Query {
    /// Search for reviews that have this string in `sub` or `opinion` field.
    pub q: Option<String>,
    /// Review with this `signature` value.
    pub signature: Option<String>,
    /// Reviews by issuer with the following PEM public key.
    pub kid: Option<String>,
    /// Reviews of subjects with the following scheme.
    pub scheme: Option<String>,
    /// Reviews issued at this UNIX time.
    pub iat: Option<i64>,
    /// Reviews with UNIX timestamp greater than this.
    pub gt_iat: Option<i64>,
    /// Reviews of the given subject URI.
    pub sub: Option<String>,
    /// Reviews with the given rating.
    pub rating: Option<i16>,
    /// Reviews with the given opinion.
    pub opinion: Option<String>,
    /// Limit the number of returned results.
    pub limit: Option<i64>,
    /// Include aggregate information about review issuers.
    pub issuers: Option<bool>,
    /// Include aggregate information about reviews of returned reviews.
    pub maresi_subjects: Option<bool>,
}

sql_function! {
    #[sql_name = "ST_DWithin"]
    fn within(c1: Nullable<Geography>, c2: Nullable<Geography>, u: Nullable<Integer>) -> Bool;
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

        let always_true = Box::new(signature.eq(signature));
        let mut f: Box<dyn BoxableExpression<schema::reviews::table, _, SqlType = Bool>> =
            always_true;
        if let Some(s) = &query.signature {
            f = Box::new(f.and(signature.eq(s)))
        }
        if let Some(s) = &query.scheme {
            f = Box::new(f.and(scheme.eq(s)))
        }
        if let Some(s) = &query.kid {
            f = Box::new(f.and(kid.eq(s)))
        }
        if let Some(s) = &query.iat {
            f = Box::new(f.and(iat.eq(s)))
        }
        if let Some(s) = &query.gt_iat {
            f = Box::new(f.and(iat.gt(s)))
        }
        // Match also in vicinity.
        if let Some(s) = &query.sub {
            let (query_scheme, geo) = validate_sub(s)?;
            if query_scheme == "geo" {
                f = Box::new(f.and(scheme.eq(query_scheme)));
                let is_close = within(coordinates, geo.coordinates, uncertainty + geo.uncertainty);
                f = Box::new(f.and(is_close))
            } else {
                f = Box::new(f.and(sub.eq(s)))
            }
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
                f = Box::new(f.and(sub.ilike(pattern.clone()).or(opinion.ilike(pattern))))
            }
        }
        Ok(reviews
            .filter(f)
            .limit(query.limit.unwrap_or(10_000))
            .select((
                signature,
                jwt,
                kid,
                (iat, sub, rating, opinion, images, metadata),
                scheme,
                (coordinates, uncertainty)
            ))
            .load::<Review>(&self.0)?)
    }

    pub fn select(&self, sig: &str) -> Result<Review, Error> {
        use schema::reviews::dsl::*;

        schema::reviews::table
            .filter(signature.eq(sig))
            .select((
                signature,
                jwt,
                kid,
                (iat, sub, rating, opinion, images, metadata),
                scheme,
                (coordinates, uncertainty)
            ))
            .load::<Review>(&self.0)?
            .into_iter()
            .next()
            .ok_or_else(|| Error::Incorrect(format!("No review found with MaReSi: {}", sig)))
    }
}
