use super::fetch::Reviews;
use super::review::{Review, Metadata};
use super::error::Error;

use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};
use sophia::ns::rdf;
use sophia::graph::{*, inmem::FastGraph};
use sophia::ns::Namespace;
use sophia::serializer::*;
use sophia::serializer::nt::NtSerializer;
use sophia::term::{Term, literal::AsLiteral, blank_node::BlankNode};
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

    let signature: Term<String> = Term::from(BlankNode::new("signature")?);
    g.insert(&signature, &rdf::type_, &s_pv)?;
    g.insert(&review, &s_identifier, &signature)?;

    let t_name: Term<String> = "signature".as_term();
    g.insert(&signature, &s_name, &t_name)?;
    let t_value: Term<String> = self.signature.as_term();
    g.insert(&signature, &s_value, &t_value)?;

    let jwt: Term<String> = Term::from(BlankNode::new("jwt")?);
    g.insert(&jwt, &rdf::type_, &s_pv)?;
    g.insert(&review, &s_identifier, &jwt)?;

    let t_name: Term<String> = "jwt".as_term();
    g.insert(&jwt, &s_name, &t_name)?;
    let t_value: Term<String> = self.jwt.as_term();
    g.insert(&jwt, &s_value, &t_value)?;

    // Subject

    let s_item_reviewed = SCHEMA.get("itemReviewed")?;
    let t_subject = match self.scheme.as_ref() {
      "geo" => {
        let place: Term<String> = Term::from(BlankNode::new("place")?);
        let s_thing = SCHEMA.get("Thing")?;
        g.insert(&place, &rdf::type_, &s_thing)?;
        let s_identifier = SCHEMA.get("identifier")?;
        let t_sub: Term<String> = self.payload.sub.as_term();
        g.insert(&place, &s_identifier, &t_sub)?;
        place
      },
      "https" => {
        let website: Term<String> = Term::from(BlankNode::new("website")?);
        let s_thing = SCHEMA.get("Thing")?;
        g.insert(&website, &rdf::type_, &s_thing)?;
        let s_identifier = SCHEMA.get("identifier")?;
        let t_sub: Term<String> = self.payload.sub.as_term();
        g.insert(&website, &s_identifier, &t_sub)?;
        website
      },
      "urn:isbn" => {
        let book: Term<String> = Term::from(BlankNode::new("book")?);
        let s_book = SCHEMA.get("Book")?;
        g.insert(&book, &rdf::type_, &s_book)?;
        let s_isbn = SCHEMA.get("isbn")?;
        let t_sub: Term<String> = self.payload.sub.as_term();
        g.insert(&book, &s_isbn, &t_sub)?;
        book
      },
      "urn:lei" => {
        let organisation: Term<String> = Term::from(BlankNode::new("organisation")?);
        let s_organisation = SCHEMA.get("Organisation")?;
        g.insert(&organisation, &rdf::type_, &s_organisation)?;
        let s_lei = SCHEMA.get("leiCode")?;
        let t_sub: Term<String> = self.payload.sub.as_term();
        g.insert(&organisation, &s_lei, &t_sub)?;
        organisation
      },
      "urn:maresi" => {
        let review: Term<String> = Term::from(BlankNode::new("review")?);
        let s_thing = SCHEMA.get("Thing")?;
        g.insert(&review, &rdf::type_, &s_thing)?;
        let s_identifier = SCHEMA.get("identifier")?;
        let t_sub: Term<String> = self.payload.sub.as_term();
        g.insert(&review, &s_identifier, &t_sub)?;
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
    let t_date_time: Term<String> = self.payload.iat.as_term();
    g.insert(&review, &s_date_created, &t_date_time)?;

    // Rating

    if let Some(rating_value) = self.payload.rating {
      let s_review_rating = SCHEMA.get("reviewRating")?;
      let s_rating = SCHEMA.get("Rating")?;
      let rating: Term<String> = Term::from(BlankNode::new("rating")?);
      g.insert(&rating, &rdf::type_, &s_rating)?;
      g.insert(&review, &s_review_rating, &rating)?;

      let s_rating_value = SCHEMA.get("ratingValue")?;
      let t_rating_value: Term<String> = rating_value.as_term();
      g.insert(&rating, &s_rating_value, &t_rating_value)?;

      let s_worst_rating = SCHEMA.get("worstRating")?;
      let t_worst_rating: Term<String> = 0.as_term();
      g.insert(&rating, &s_worst_rating, &t_worst_rating)?;

      let s_best_rating = SCHEMA.get("bestRating")?;
      let t_best_rating: Term<String> = 100.as_term();
      g.insert(&rating, &s_best_rating, &t_best_rating)?;
    }

    // Opinion

    if let Some(ref opinion) = self.payload.opinion {
      let s_review_body = SCHEMA.get("reviewBody")?;
      let t_opinion: Term<String> = opinion.as_term();
      g.insert(&review, &s_review_body, &t_opinion)?;
    }

    // Metadata

    if let Some(metadata) = &self.payload.metadata {
      let m: Metadata = serde_json::from_value(metadata.clone())?;
      insert_metadata(g, &review, &person, m)?;
    }

    Ok(())
  }
}

fn insert_string(g: &mut FastGraph, sub: &Term<&str>, prop: Term<&str>, v: &serde_json::Value) -> Result<(), Error> {
  if let Some(vs) =  v.as_str() {
    let t_v: Term<String> = vs.as_term();
    g.insert(sub, &prop, &t_v)?;
  }
  Ok(())
}

use std::str::FromStr;

fn insert_bool(g: &mut FastGraph, sub: &Term<&str>, prop: Term<&str>, v: &serde_json::Value) -> Result<(), Error> {
  if let Some(vs) =  v.as_str().and_then(|v| bool::from_str(v).ok()) {
    let t_v: Term<String> = vs.as_term();
    g.insert(sub, &prop, &t_v)?;
  }
  Ok(())
}

fn insert_metadata(g: &mut FastGraph, review: &Term<&str>, person: &Term<&str>, m: Metadata) -> Result<(), Error> {
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

