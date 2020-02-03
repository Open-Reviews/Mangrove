use super::database::{self, DbConn};
use super::error::Error;
use super::schema::reviews;
use isbn::Isbn;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use url::Url;
use once_cell::sync::Lazy;
use std::borrow::Cow;
use std::collections::BTreeMap;
use std::env;
use std::time::Duration;
use std::str::FromStr;

/// Mangrove Review used for submission or retrieval from the database.
#[derive(
    Debug, PartialEq, Serialize, Deserialize, Identifiable, Insertable, Queryable, JsonSchema,
)]
#[primary_key(signature)]
pub struct Review {
    /// JWT signature by the review issuer.
    pub signature: String,
    /// Review in JWT format.
    pub jwt: String,
    /// Public key of the reviewer in PEM format.
    pub kid: String,
    /// Primary content of the review.
    #[diesel(embed)]
    pub payload: Payload
}

static JWT_VALIDATION: Lazy<jsonwebtoken::Validation> = Lazy::new(|| {
    jsonwebtoken::Validation {
        leeway: 5,
        validate_exp: false,
        algorithms: vec![jsonwebtoken::Algorithm::ES256],
        ..Default::default()
    }
});

impl FromStr for Review {
    type Err = Error;

    fn from_str(jwt_review: &str) -> Result<Self, Self::Err> {
        // Do not put it up due to generic names.
        use jsonwebtoken::{decode_header, decode, DecodingKey};

        let kid = decode_header(&jwt_review)?
            .kid
            .ok_or_else(|| Error::Incorrect("kid is missing from header".into()))?;

        let decoded = decode::<Payload>(
            &jwt_review, &DecodingKey::from_ec_pem(kid.as_bytes())?,
            &JWT_VALIDATION
        )?;

        Ok(Review{
            jwt: jwt_review.into(),
            kid,
            // Use the JWT structure to find signature.
            signature: jwt_review
                .split('.')
                .nth(2)
                .expect("Assuming jsonwebtoken does validation when decoding above.")
                .into(),
            payload: decoded.claims
        })
    }
}

impl Review {
    fn validate_unique(&self, conn: &DbConn) -> Result<(), Error> {
        let similar = conn.filter(database::Query {
            kid: Some(self.kid.clone()),
            sub: Some(self.payload.sub.clone()),
            rating: self.payload.rating,
            opinion: self.payload.opinion.clone(),
            ..Default::default()
        })?;
        if similar.is_empty() {
            Ok(())
        } else {
            Err(Error::Incorrect(
                "Duplicate entry found in the database, please submit reviews with differing rating or opinion.".into()
            ))
        }
    }

    pub fn validate(&self, conn: &DbConn) -> Result<bool, Error> {
        self.validate_unique(conn)?;
        self.payload.validate(conn)
    }
}

/// Primary content of the review, this is what gets serialized for signing.
#[derive(
    Debug, PartialEq, Serialize, Deserialize, Insertable, Queryable, JsonSchema,
)]

#[table_name = "reviews"]
pub struct Payload {
    /// Unix Time at which the review was signed.
    pub iat: i64,
    /// URI of the subject that is being reviewed.
    pub sub: String,
    /// Rating in range [0, 100] indicating how likely
    /// the issuer is to recommend the subject.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rating: Option<Rating>,
    /// Text of an opinion that the issuer had about the subject.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub opinion: Option<String>,
    /// Hashes referring to additional data,
    /// such as pictures available at https://files.mangrove.reviews/<hash>
    #[serde(skip_serializing_if = "Option::is_none")]
    pub images: Option<serde_json::Value>,
    /// Any data relating to the issuer or circumstances of leaving review.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

pub type Rating = i16;

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Images(Vec<Image>);

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Image {
    src: String,
    label: Option<String>
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Metadata(BTreeMap<String, serde_json::Value>);

impl Payload {
    /// Check the Review roughly in order of complexity of checks.
    pub fn validate(&self, conn: &DbConn) -> Result<bool, Error> {
        let images: Option<Images> = match self.images {
            Some(ref v) => serde_json::from_value(v.clone())?,
            None => None,
        };
        let metadata: Option<Metadata> = match self.metadata {
            Some(ref v) => serde_json::from_value(v.clone())?,
            None => None,
        };
        check_timestamp(Duration::from_secs(self.iat as u64))?;
        if self.rating.is_none() && self.opinion.is_none() {
            return Err(Error::Incorrect(
                "Review must contain either a rating or a review.".into(),
            ));
        }
        self.rating.map_or(Ok(()), check_rating)?;
        self.opinion
            .as_ref()
            .map_or(Ok(()), |s| check_opinion(&s))?;
        metadata.map_or(Ok(()), |m| {
            m.0.into_iter().map(|(k, v)| check_metadata(&k, v)).collect()
        })?;
        images.map_or(Ok(()), |e| {
            e.0.iter().map(|img| check_image(img)).collect()
        })?;
        check_sub(conn, &self.sub)?;
        Ok(true)
    }
}

const MANGROVE_EPOCH: Duration = Duration::from_secs(1_577_836_800);

fn check_timestamp(iat: Duration) -> Result<(), Error> {
    if iat < MANGROVE_EPOCH {
        Err(Error::Incorrect("Claim too old (`iat` indicates date lower than year 2020).".into()))
    } else {
        Ok(())
    }
}

const MAX_RATING: Rating = 100;

fn check_rating(rating: Rating) -> Result<(), Error> {
    if rating < 0 || rating > MAX_RATING {
        Err(Error::Incorrect("Rating out of range.".into()))
    } else {
        Ok(())
    }
}

const MAX_REVIEW_LENGTH: usize = 500;

fn check_opinion(opinion: &str) -> Result<(), Error> {
    if opinion.len() <= MAX_REVIEW_LENGTH {
        Ok(())
    } else {
        Err(Error::Incorrect("Opinion too long.".into()))
    }
}

/// Check the q= query field content.
fn check_geo_q(q: Cow<str>) -> Result<(), Error> {
    let mut elements = q.split('(');
    let mut coords = elements
        .next()
        .ok_or_else(|| Error::Incorrect("No coordinates specified.".into()))?
        .split(',')
        .map(|c| c.parse());
    let lat: f32 = coords
        .next()
        .ok_or_else(|| Error::Incorrect("No latitude found.".into()))??;
    if -90. > lat || lat > 90. {
        return Err(Error::Incorrect("Latitude out of range.".into()));
    }
    let lon: f32 = coords
        .next()
        .ok_or_else(|| Error::Incorrect("No longitude found.".into()))??;
    if -180. > lon || lon > 180. {
        return Err(Error::Incorrect("Longitude out of range.".into()));
    }
    if elements
        .next()
        .ok_or_else(|| Error::Incorrect("No name found.".into()))?
        .ends_with(')')
    {
        Ok(())
    } else {
        Err(Error::Incorrect("Name must be inside parenthesis.".into()))
    }
}

fn check_geo_param(param: (Cow<str>, Cow<str>)) -> Result<(), Error> {
    match param.0.as_ref() {
        "q" => check_geo_q(param.1),
        "u" => match param.1.parse::<f32>() {
            Ok(n) if 0. < n && n < 2000. => Ok(()),
            _ => Err(Error::Incorrect("Uncertainty incorrect.".into())),
        },
        _ => Err(Error::Incorrect("Query field unknown.".into())),
    }
}

/// Check if `geo` URI is correct.
fn check_place(geo: &Url) -> Result<(), Error> {
    let mut pairs = geo.query_pairs().peekable();
    if pairs.peek().is_some() {
        pairs.map(check_geo_param).collect()
    } else {
        Err(Error::Incorrect("Geo URI has to specify query.".into()))
    }
}

fn check_url(id: &str) -> Result<(), url::ParseError> {
    Url::parse(id).map(|_| ())
}

fn check_lei(id: &str) -> Result<(), Error> {
    if reqwest::get(&format!("https://api.gleif.org/api/v1/lei-records/{}", id))?
        .status()
        .is_success()
    {
        Ok(())
    } else {
        Err(Error::Incorrect(
            "LEI not found in the GLEIF database.".into(),
        ))
    }
}

fn check_isbn(id: &str) -> Result<(), Error> {
    match id.parse::<Isbn>() {
        Ok(_) => Ok(()),
        Err(e) => Err(Error::Incorrect(format!("ISBN incorrect: {:?}", e))),
    }
}

// check Mangrove Review Signature, which is a unique id of a review.
fn check_maresi(conn: &DbConn, id: &str) -> Result<(), Error> {
    conn.select(id).map(|_| ())
}

fn check_sub(conn: &DbConn, uri: &str) -> Result<(), Error> {
    let parsed = Url::parse(&uri)?;
    match parsed.scheme() {
        "urn" => {
            let sub = Url::parse(parsed.path())?;
            // Parsing lower cases the scheme.
            match sub.scheme() {
                "lei" => check_lei(sub.path()),
                "isbn" => check_isbn(sub.path()),
                "maresi" => check_maresi(conn, sub.path()),
                s => Err(Error::Incorrect(format!("Unknown URN scheme: {}", s))),
            }
        }
        "geo" => check_place(&parsed).map_err(Into::into),
        "http" | "https" => check_url(uri).map_err(Into::into),
        s => Err(Error::Incorrect(format!("Unknown URI scheme: {}", s))),
    }
}

fn check_image(img: &Image) -> Result<(), Error> {
    if let Some(l) = img.label {
        if l.len() > 50 {
            return Err(Error::Incorrect(format!("Image label is too long: {}", l)))
        }
    }
    let exists = reqwest::get(&img.src)?.text()?.parse()?;
    if exists {
        Ok(())
    } else {
        Err(Error::Incorrect(format!(
            "No file can be found online: {:?}",
            img.src
        )))
    }
}

fn check_short_string(key: &str, value: serde_json::Value) -> Result<(), Error> {
    if serde_json::from_value::<String>(value)?.len() > 20 {
        Err(Error::Incorrect(format!("Field {} is too long.", key)))
    } else {
        Ok(())
    }
}

fn check_uri(key: &str, value: serde_json::Value) -> Result<(), Error> {
    let uri = serde_json::from_value::<String>(value)?;
    match Url::parse(&uri) {
        Ok(_) => Ok(()),
        Err(e) => Err(Error::Incorrect(format!(
            "Unable to parse URI for {}: {}",
            key, e
        ))),
    }
}

fn check_flag(key: &str, value: serde_json::Value) -> Result<(), Error> {
    match value.as_str() {
        Some("true") => Ok(()),
        _ => Err(Error::Incorrect(format!(
            "Flag field {} can only have value equal to `true`",
            key
        ))),
    }
}

fn check_metadata(key: &str, value: serde_json::Value) -> Result<(), Error> {
    match key {
        "client_id" => check_uri(key, value),
        "nickname" => check_short_string(key, value),
        "age" => match value.as_u64() {
            Some(n) if n <= 200 => Ok(()),
            _ => Err(Error::Incorrect("Provided age is incorrect.".into())),
        },
        "experience_context" => check_short_string(key, value),
        "openid" => check_short_string(key, value),
        "data_source" => check_uri(key, value),
        "issuer_index" => match value.as_u64() {
            Some(n) if n <= 9_007_199_254_740_991 => Ok(()),
            _ => Err(Error::Incorrect("Provided index is incorrect.".into())),
        },
        "preferred_username" => check_short_string(key, value),
        "birthdate" => check_short_string(key, value),
        "family_name" => check_short_string(key, value),
        "given_name" => check_short_string(key, value),
        "gender" => check_short_string(key, value),
        "is_generated" => check_flag(key, value),
        "is_affiliated" => check_flag(key, value),
        "is_personal_experience" => check_flag(key, value),
        _ => Err(Error::Incorrect(
            "Key is not one of Mangrove Core Metadata Keys.".into(),
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verification() {
        let pubkey = untrusted::Input::from(&[
            4, 253, 66, 207, 28, 80, 88, 205, 80, 193, 228, 51, 157, 213, 215, 192, 1, 9, 132, 22,
            113, 148, 88, 74, 30, 114, 138, 210, 81, 120, 37, 204, 33, 207, 1, 215, 76, 125, 15,
            71, 120, 25, 47, 210, 116, 199, 156, 233, 204, 9, 217, 251, 226, 88, 107, 121, 219, 41,
            38, 138, 34, 188, 123, 112, 126,
        ]);
        let msg = untrusted::Input::from(&[
            166, 103, 118, 101, 114, 115, 105, 111, 110, 1, 105, 112, 117, 98, 108, 105, 99, 107,
            101, 121, 120, 130, 48, 52, 102, 100, 52, 50, 99, 102, 49, 99, 53, 48, 53, 56, 99, 100,
            53, 48, 99, 49, 101, 52, 51, 51, 57, 100, 100, 53, 100, 55, 99, 48, 48, 49, 48, 57, 56,
            52, 49, 54, 55, 49, 57, 52, 53, 56, 52, 97, 49, 101, 55, 50, 56, 97, 100, 50, 53, 49,
            55, 56, 50, 53, 99, 99, 50, 49, 99, 102, 48, 49, 100, 55, 52, 99, 55, 100, 48, 102, 52,
            55, 55, 56, 49, 57, 50, 102, 100, 50, 55, 52, 99, 55, 57, 99, 101, 57, 99, 99, 48, 57,
            100, 57, 102, 98, 101, 50, 53, 56, 54, 98, 55, 57, 100, 98, 50, 57, 50, 54, 56, 97, 50,
            50, 98, 99, 55, 98, 55, 48, 55, 101, 105, 116, 105, 109, 101, 115, 116, 97, 109, 112,
            26, 93, 157, 246, 255, 102, 105, 100, 116, 121, 112, 101, 99, 85, 82, 76, 98, 105, 100,
            113, 104, 116, 116, 112, 58, 47, 47, 103, 111, 111, 103, 108, 101, 46, 99, 111, 109,
            102, 114, 97, 116, 105, 110, 103, 24, 50,
        ]);
        let sig = untrusted::Input::from(&[
            194, 167, 81, 117, 30, 229, 244, 238, 28, 127, 29, 111, 138, 117, 234, 216, 111, 34,
            188, 145, 122, 9, 160, 165, 97, 181, 161, 195, 99, 150, 130, 75, 48, 170, 116, 73, 69,
            89, 231, 128, 67, 191, 45, 35, 104, 86, 106, 98, 111, 182, 114, 75, 96, 50, 99, 90,
            127, 241, 155, 0, 0, 121, 154, 77,
        ]);
        assert!(signature::verify(&signature::ECDSA_P256_SHA256_FIXED, pubkey, msg, sig).is_ok());
    }

    #[test]
    fn test_uri() {
        check_place(&Url::parse("geo:0,0?u=30&q=47.1691576,8.514572(Juanitos)").unwrap()).unwrap();
        check_place(&Url::parse("geo:?u=30&q=47.1691576,8.514572(Juanitos)").unwrap()).unwrap();
        assert!(check_place(&Url::parse("geo:37.78,-122.399").unwrap()).is_err());
    }
}
