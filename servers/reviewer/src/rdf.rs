use super::fetch::Reviews;
use super::review::Review;
use super::error::Error;

use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};
use sophia::ns::rdf;
use sophia::graph::{*, inmem::FastGraph};
use sophia::ns::Namespace;
use sophia::serializer::*;
use sophia::serializer::nt::NtSerializer;
use sophia::term::{Term, literal::AsLiteral};

pub trait IntoRDF {
  fn insert(&self, graph: &mut FastGraph) -> Result<(), Error>;
  fn into_ntriples(&self) -> Result<String, Error> {
    let mut g = FastGraph::new();

    self.insert(&mut g)?;

    let mut nt_stringifier = NtSerializer::new_stringifier();
    Ok(nt_stringifier.serialize_graph(&g).expect("Infallible.").as_str().into())
  }
}

impl IntoRDF for Review {
  fn insert(&self, g: &mut FastGraph) -> Result<(), Error> {
    let schema = Namespace::new("http://schema.org/")?;
    let reviews = Namespace::new("https://api.mangrove.reviews/review/")?;
    let issuers = Namespace::new("https://api.mangrove.reviews/issuer/")?;

    // Define nodes and their types.
    let s_review = schema.get("Review")?;
    let review = reviews.get(&*self.signature)?;
    g.insert(&review, &rdf::type_, &s_review).expect("Infallible.");

    let s_person = schema.get("Person")?;
    
    let encoded_kid: String = utf8_percent_encode(&self.kid, NON_ALPHANUMERIC).to_string();
    let person = issuers.get(&*encoded_kid)?;
    g.insert(&person, &rdf::type_, &s_person).expect("Infallible.");

    // Define relationships between nodes.
    let s_author = schema.get("author")?;

    g.insert(&review, &s_author, &person).expect("Infallible.");

    if let Some(rating) = self.payload.rating {
      let s_review_rating = schema.get("reviewRating")?;
      let t_rating: Term<String> = rating.as_term();
      g.insert(&review, &s_review_rating, &t_rating).expect("Infallible.");
    }

    if let Some(ref opinion) = self.payload.opinion {
      let s_review_body = schema.get("reviewBody")?;
      let t_opinion: Term<String> = opinion.as_term();
      g.insert(&review, &s_review_body, &t_opinion).expect("Infallible.");
    }

    Ok(())
  }
}

impl IntoRDF for Reviews {
  fn insert(&self, graph: &mut FastGraph) -> Result<(), Error> {
    for r in &self.reviews {
      r.insert(graph)?;
    }
    Ok(())
  }
}

#[cfg(test)]
mod tests {
    use super::*;

    /*
    #[test]
    fn add_columns() {
        use diesel::prelude::*;
        use schema::reviews::dsl::*;
        use diesel::{QueryDsl, ExpressionMethods, pg::Pg};

        let conn = PgConnection::establish(&database_url)
            .expect(&format!("Error connecting to {}", database_url));

        let target = reviews.filter(sub.like("geo:%"));
        //diesel::update(target).set(coordinates.eq(sub)).execute(&conn).unwrap();
        //diesel::update(target).set(uncertainty.eq(sub)).execute(&conn).unwrap();
    }
    */
    use super::super::review::{Review, Payload};

    #[test]
    fn annotated_review() {
      let r = Review {
        signature: "SIG".into(),
        jwt: "JWT".into(),
        kid: "KID".into(),
        payload: Payload {
          iat: 123,
          sub: "SUB".into(),
          rating: Some(50),
          opinion: Some("OPINION".into()),
          images: None,
          metadata: None,
        },
        scheme: "SCHEME".into(),
        geo: Default::default(),
      };
      println!("{}", r.into_ntriples().unwrap());

        use sophia::ns::rdf;
        use sophia::graph::{*, inmem::FastGraph};
        use sophia::ns::Namespace;
        use sophia::serializer::*;
        use sophia::serializer::nt::NtSerializer;
        use sophia::term::{StaticTerm, literal::AsLiteral};

        let schema = Namespace::new("http://schema.org/").unwrap();
        let s_review = schema.get("Review").unwrap();
        let s_thing = schema.get("Thing").unwrap();

        let s_item_reviewed = schema.get("itemReviewed").unwrap();
        let s_identifier = schema.get("identifier").unwrap();

        let mut g = FastGraph::new();
        let review: StaticTerm = "review".as_term();
        g.insert(&review, &rdf::type_, &s_review).unwrap();
        g.insert(&s_review, &s_item_reviewed, &s_thing).unwrap();
        let sub: StaticTerm = "geo:123".as_term();
        g.insert(&s_thing, &s_identifier, &sub).unwrap();

        let mut nt_stringifier = NtSerializer::new_stringifier();
        let turt = nt_stringifier.serialize_graph(&g).unwrap().as_str();
        println!("The resulting graph\n{}", turt);
    }
}

