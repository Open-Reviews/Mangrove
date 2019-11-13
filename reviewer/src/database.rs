use diesel::prelude::*;
use diesel::sql_types::Bool;
use super::error::Error;
use super::review::Review;
use super::schema;

#[database("pg_reviews")]
pub struct DbConn(diesel::PgConnection);

/// TODO: reconcile with Review, allow metadata and extradata
#[derive(Default, Debug, FromForm)]
pub struct Query {
    pub signature: Option<String>,
    pub iss: Option<String>,
    pub iat: Option<i64>,
    pub sub: Option<String>,
    pub rating: Option<i16>,
    pub opinion: Option<String>,
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
        Ok(reviews.filter(f).load::<Review>(&self.0)?)
    }

    pub fn select(&self, sig: &str) -> Result<Review, Error> {
        schema::reviews::table
            .filter(schema::reviews::signature.eq(sig))
            .load::<Review>(&self.0)?
            .into_iter()
            .next()
            .ok_or_else(|| Error::Incorrect(format!("No review found with MaReSi: {}", sig)))
    }

    pub fn search(&self, search: String) -> Result<Vec<Review>, Error> {
        Ok(vec![])
    }
}
