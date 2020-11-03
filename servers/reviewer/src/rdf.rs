use super::fetch::Reviews;
use super::review::{Review, Metadata};
use super::error::Error;

use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};
use sophia::ns::rdf;
use sophia::graph::{*, inmem::FastGraph};
use sophia::ns::Namespace;
use sophia::serializer::*;
use sophia::serializer::nt::NtSerializer;
use sophia::term::{Term, TermError, SimpleIri, literal::convert::AsLiteral};
use once_cell::sync::Lazy;

pub trait IntoRDF {
  fn insert(&self, graph: &mut FastGraph) -> Result<(), Error>;
  fn into_ntriples(&self) -> Result<String, Error> {
    let mut g = FastGraph::new();

    self.insert(&mut g)?;

    let mut nt_stringifier = NtSerializer::new_stringifier();
    Ok(nt_stringifier.serialize_graph(&g).expect("Infallible.").as_str().into())
  }
}

static SCHEMA: Lazy<Namespace<&str>> = Lazy::new(|| {
  Namespace::new("http://schema.org/").expect("Correct namespace.")
});

fn new_bnode(name: &str, id: &str) -> Result<Term<String>, TermError> {
  Term::new_bnode(name)
}

/// Use http://rdf-translator.appspot.com/ and https://json-ld.org/playground/ for checking.
impl IntoRDF for Review {
  fn insert(&self, g: &mut FastGraph) -> Result<(), Error> {
    let reviews = Namespace::new("https://api.mangrove.reviews/review/")?;
    let issuers = Namespace::new("https://api.mangrove.reviews/issuer/")?;

    // Review root.
    let s_review = SCHEMA.get("Review")?;
    let review = reviews.get(&*self.signature)?;
    g.insert(&review, &rdf::type_, &s_review)?;

    // Identifiers.
    let s_identifier = SCHEMA.get("identifier")?;

    let s_pv = SCHEMA.get("PropertyValue")?;
    let s_name = SCHEMA.get("name")?;
    let s_value = SCHEMA.get("value")?;

    let signature = new_bnode("signature", &self.signature)?;
    g.insert(&signature, &rdf::type_, &s_pv)?;
    g.insert(&review, &s_identifier, &signature)?;

    g.insert(&signature, &s_name, &"signature".as_literal())?;
    g.insert(&signature, &s_value, &self.signature.as_literal())?;

    let jwt = new_bnode("jwt", &self.jwt)?;
    g.insert(&jwt, &rdf::type_, &s_pv)?;
    g.insert(&review, &s_identifier, &jwt)?;

    g.insert(&jwt, &s_name, &"jwt".as_literal())?;
    g.insert(&jwt, &s_value, &self.jwt.as_literal())?;

    // Subject

    let s_item_reviewed = SCHEMA.get("itemReviewed")?;
    let t_subject = match self.scheme.as_ref() {
      "geo" => {
        let place = new_bnode("place", &self.payload.sub)?;
        let s_thing = SCHEMA.get("Thing")?;
        g.insert(&place, &rdf::type_, &s_thing)?;
        let s_identifier = SCHEMA.get("identifier")?;
        g.insert(&place, &s_identifier, &self.payload.sub.as_literal())?;
        place
      },
      "https" => {
        let website = new_bnode("website", &self.payload.sub)?;
        let s_thing = SCHEMA.get("Thing")?;
        g.insert(&website, &rdf::type_, &s_thing)?;
        let s_identifier = SCHEMA.get("identifier")?;
        g.insert(&website, &s_identifier, &self.payload.sub.as_literal())?;
        website
      },
      "urn:isbn" => {
        let book = new_bnode("book", &self.payload.sub)?;
        let s_book = SCHEMA.get("Book")?;
        g.insert(&book, &rdf::type_, &s_book)?;
        let s_isbn = SCHEMA.get("isbn")?;
        g.insert(&book, &s_isbn, &self.payload.sub.as_literal())?;
        book
      },
      "urn:lei" => {
        let organisation = new_bnode("organisation", &self.payload.sub)?;
        let s_organisation = SCHEMA.get("Organisation")?;
        g.insert(&organisation, &rdf::type_, &s_organisation)?;
        let s_lei = SCHEMA.get("leiCode")?;
        g.insert(&organisation, &s_lei, &self.payload.sub.as_literal())?;
        organisation
      },
      "urn:maresi" => {
        let review = new_bnode("review", &self.payload.sub)?;
        let s_thing = SCHEMA.get("Thing")?;
        g.insert(&review, &rdf::type_, &s_thing)?;
        let s_identifier = SCHEMA.get("identifier")?;
        g.insert(&review, &s_identifier, &self.payload.sub.as_literal())?;
        review
      },
      // TODO: add remaining schemes
      _ => Term::new_iri("unknown subject identifier scheme")?,
    };
    g.insert(&review, &s_item_reviewed, &t_subject)?;

    // Author

    let s_person = SCHEMA.get("Person")?;
    let encoded_kid: String = utf8_percent_encode(&self.kid, NON_ALPHANUMERIC).to_string();
    let person = issuers.get(&*encoded_kid)?;
    g.insert(&person, &rdf::type_, &s_person)?;

    let s_author = SCHEMA.get("author")?;
    g.insert(&review, &s_author, &person)?;

    // Date created

    let s_date_created = SCHEMA.get("dateCreated")?;
    // TODO: encode the dateTime correctly
    g.insert(&review, &s_date_created, &self.payload.iat.as_literal())?;

    // Rating

    if let Some(rating_value) = self.payload.rating {
      let s_review_rating = SCHEMA.get("reviewRating")?;
      let s_rating = SCHEMA.get("Rating")?;
      let rating = new_bnode("rating", &rating_value)?;
      g.insert(&rating, &rdf::type_, &s_rating)?;
      g.insert(&review, &s_review_rating, &rating)?;

      let s_rating_value = SCHEMA.get("ratingValue")?;
      g.insert(&rating, &s_rating_value, &rating_value.as_literal())?;

      let s_worst_rating = SCHEMA.get("worstRating")?;
      g.insert(&rating, &s_worst_rating, &0.as_literal())?;

      let s_best_rating = SCHEMA.get("bestRating")?;
      g.insert(&rating, &s_best_rating, &100.as_literal())?;
    }

    // Opinion

    if let Some(ref opinion) = self.payload.opinion {
      let s_review_body = SCHEMA.get("reviewBody")?;
      g.insert(&review, &s_review_body, &opinion.as_literal())?;
    }

    // Metadata

    if let Some(metadata) = &self.payload.metadata {
      let m: Metadata = serde_json::from_value(metadata.clone())?;
      insert_metadata(g, &review, &person, m)?;
    }

    Ok(())
  }
}

fn insert_string(g: &mut FastGraph, sub: &SimpleIri, prop: SimpleIri, v: &serde_json::Value) -> Result<(), Error> {
  if let Some(vs) =  v.as_str() {
    g.insert(sub, &prop, &vs.as_literal())?;
  }
  Ok(())
}

use std::str::FromStr;

fn insert_bool(g: &mut FastGraph, sub: &SimpleIri, prop: SimpleIri, v: &serde_json::Value) -> Result<(), Error> {
  if let Some(vs) =  v.as_str().and_then(|v| bool::from_str(v).ok()) {
    g.insert(sub, &prop, &vs.as_literal())?;
  }
  Ok(())
}

fn insert_metadata(g: &mut FastGraph, review: &SimpleIri, person: &SimpleIri, m: Metadata) -> Result<(), Error> {
  let open_review = Namespace::new("https://open-reviews.net/schema/")?;
  for (k, v) in m.0.iter() {
    match k.as_ref() {
      "client_id" => insert_string(g, review, open_review.get("clientId")?, v),
      "nickname" => insert_string(g, person, SCHEMA.get("name")?, v),
      "age" => Ok(()),
      "experience_context" =>
        insert_string(g, review, open_review.get("experienceContext")?, v),
      "openid" => Ok(()),
      "data_source" => Ok(()),
      "issuer_index" => Ok(()),
      "preferred_username" =>
        insert_string(g, person, SCHEMA.get("alternateName")?, v),
      "birthdate" => Ok(()),
      "family_name" =>
        insert_string(g, person, SCHEMA.get("familyName")?, v),
      "given_name" =>
        insert_string(g, person, SCHEMA.get("givenName")?, v),
      "gender" =>
        insert_string(g, person, SCHEMA.get("gender")?, v),
      "is_generated" =>
        insert_bool(g, review, open_review.get("isGenerated")?, v),
      "is_affiliated" =>
        insert_bool(g, review, open_review.get("isAffiliated")?, v),
      "is_personal_experience" =>
        insert_bool(g, review, open_review.get("isPersonalExperience")?, v),
      _ => Err(Error::Incorrect(
          "Key is not one of Mangrove Core Metadata Keys.".into(),
      )),
    }?;
  }
  Ok(())
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

