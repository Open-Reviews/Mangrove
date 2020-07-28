use super::database::{self, DbConn};
use super::error::Error;
use super::schema::reviews;
use rusoto_s3::{DeleteObjectTaggingRequest, S3Client, S3};
use isbn::Isbn;
use serde::{Deserialize, Serialize};
use url::Url;
use diesel_geography::types::GeogPoint;
use once_cell::sync::Lazy;
use std::borrow::Cow;
use std::collections::BTreeMap;
use std::time::Duration;
use std::str::FromStr;

const IMAGES_BUCKET: &str = "files.mangrove.reviews";

static JWT_VALIDATION: Lazy<jsonwebtoken::Validation> = Lazy::new(|| {
    jsonwebtoken::Validation {
        leeway: 5,
        validate_exp: false,
        algorithms: vec![jsonwebtoken::Algorithm::ES256],
        ..Default::default()
    }
});

static S3_CLIENT: Lazy<S3Client> = Lazy::new(|| { S3Client::new(Default::default()) });

/// Mangrove Review used for submission or retrieval from the database.
#[derive(Debug, PartialEq, Serialize, Deserialize, Identifiable, Insertable, Queryable)]
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
    pub payload: Payload,
    pub scheme: String,
    #[diesel(embed)]
    pub geo: UncertainPoint,
}

impl FromStr for Review {
    type Err = Error;

    fn from_str(jwt_review: &str) -> Result<Self, Self::Err> {
        // Do not put it up due to generic names.
        use jsonwebtoken::{decode_header, decode, DecodingKey};

        let kid = decode_header(&jwt_review)?
            .kid
            .ok_or_else(|| Error::Incorrect("kid is missing from header".into()))?;

        let payload = decode::<Payload>(
            &jwt_review, &DecodingKey::from_ec_pem(kid.as_bytes())?,
            &JWT_VALIDATION
        )?.claims;
        payload.validate()?;

        let (scheme, geo) = validate_sub(&payload.sub)?;

        Ok(Review{
            jwt: jwt_review.into(),
            kid,
            // Use the JWT structure to find signature.
            signature: jwt_review
                .split('.')
                .nth(2)
                .expect("Assuming jsonwebtoken does validation when decoding above.")
                .into(),
            payload,
            scheme,
            geo
        })
    }
}

impl Review {
    pub fn validate_db(&self, conn: &DbConn) -> Result<(), Error> {
        if self.scheme == "urn:maresi" {
            check_maresi(conn, &self.payload.sub)?;
        }
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
}

/// Primary content of the review, this is what gets serialized for signing.
#[derive(Debug, PartialEq, Serialize, Deserialize, Insertable, Queryable)]
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

impl Payload {
    /// Check the Review roughly in order of complexity of checks.
    pub fn validate(&self) -> Result<bool, Error> {
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
        images.as_ref().map_or(Ok(()), |e| {
            e.0.iter().map(|img| img.validate()).collect()
        })?;
        // Make sure images stick around.
        images.map_or(Ok(()), |e| {
            e.0.iter().map(|img| img.persist()).collect()
        })?;
        Ok(true)
    }
}

pub type Rating = i16;

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct Metadata(pub BTreeMap<String, serde_json::Value>);

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Images(Vec<Image>);

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Image {
    src: String,
    label: Option<String>
}

impl Image {
    fn validate(&self) -> Result<(), Error> {
        if let Some(l) = &self.label {
            if l.len() > 50 {
                return Err(Error::Incorrect(format!("Image label is too long: {}", l)))
            }
        }
        println!("Checking the file: {}", self.src);
        let exists = reqwest::blocking::get(&self.src)?.status().is_success();
        if exists {
            Ok(())
        } else {
            Err(Error::Incorrect(format!(
                "No file can be found online: {:?}",
                self.src
            )))
        }
    }

    fn persist(&self) -> Result<(), Error> {
        let parsed = Url::parse(&self.src)?;
        if parsed.host_str() != Some(IMAGES_BUCKET) {
            // Nothing to be done if the image is not on the original server.
            return Ok(())
        }
        let key = parsed
            .path()
            .get(1..)
            .ok_or_else(|| Error::Incorrect(format!(
                "File hash is too short: {:?}", parsed.path())
            ))?
            .into();
        S3_CLIENT.delete_object_tagging(DeleteObjectTaggingRequest {
            bucket: IMAGES_BUCKET.into(),
            key,
            version_id: None,
        })
        .sync()?;
        Ok(())
    }
}

#[derive(Debug, PartialEq, Default, Serialize, Deserialize, Insertable, Queryable)]
#[table_name = "reviews"]
pub struct UncertainPoint {
    pub coordinates: Option<GeogPoint>,
    pub uncertainty: Option<i32>
}

const MANGROVE_EPOCH: Duration = Duration::from_secs(1_577_836_800);

fn check_timestamp(iat: Duration) -> Result<(), Error> {
    if iat < MANGROVE_EPOCH {
        Err(Error::Incorrect("Claim too old (`iat` indicates date lower than year 2020).".into()))
    } else {
        Ok(())
    }
}

pub const MAX_RATING: Rating = 100;

fn check_rating(rating: Rating) -> Result<(), Error> {
    if rating < 0 || rating > MAX_RATING {
        Err(Error::Incorrect("Rating out of range.".into()))
    } else {
        Ok(())
    }
}

const MAX_REVIEW_LENGTH: usize = 1000;

fn check_opinion(opinion: &str) -> Result<(), Error> {
    if opinion.len() <= MAX_REVIEW_LENGTH {
        Ok(())
    } else {
        Err(Error::Incorrect("Opinion too long.".into()))
    }
}

fn check_geo_param(param: (Cow<str>, Cow<str>)) -> Result<Option<i32>, Error> {
    match param.0.as_ref() {
        "q" => if param.1.len() > 100 {
            Err(Error::Incorrect("Place name too long.".into()))
        } else {
            Ok(None)
        },
        "u" => match param.1.parse::<i32>() {
            Ok(n) if 0 < n && n < 40_000_000 => Ok(Some(n)),
            _ => Err(Error::Incorrect("Uncertainty incorrect.".into())),
        },
        _ => Err(Error::Incorrect("Query field unknown.".into())),
    }
}

/// Check if `geo` URI is correct.
fn check_place(geo: &Url) -> Result<UncertainPoint, Error> {
    let mut coords = geo
        .path()
        .split(',')
        .map(|c| c.parse());
    let lat = coords
        .next()
        .ok_or_else(|| Error::Incorrect("No latitude found.".into()))??;
    if -90. > lat || lat > 90. {
        return Err(Error::Incorrect("Latitude out of range.".into()));
    }
    let lon = coords
        .next()
        .ok_or_else(|| Error::Incorrect("No longitude found.".into()))??;
    if -180. > lon || lon > 180. {
        return Err(Error::Incorrect("Longitude out of range.".into()));
    }
    let mut pairs = geo.query_pairs().peekable();
    if pairs.peek().is_some() {
        let a = pairs
            .map(check_geo_param)
            .collect::<Result<Vec<Option<i32>>, Error>>()?;
        if let Some(uncertainty) = a.into_iter().find(Option::is_some) {
            Ok(UncertainPoint {
                coordinates: Some(GeogPoint { lon, lat, srid: Some(4326) }),
                uncertainty
            })
        } else {
            Err(Error::Incorrect("Geo URI has to specify uncertainty.".into()))
        }
    } else {
        Err(Error::Incorrect("Geo URI has to specify query.".into()))
    }

}

fn check_url(uri: &Url) -> Result<(), Error> {
    let exists = reqwest::blocking::get(uri.as_str())?.status().is_success();
    if exists {
        Ok(())
    } else {
        Err(Error::Incorrect(format!(
            "Subject is not publicly accessible: {}",
            uri
        )))
    }
}

fn check_lei(id: &str) -> Result<(), Error> {
    if reqwest::blocking::get(&format!("https://api.gleif.org/api/v1/lei-records/{}", id))?
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
    if id.chars().any(|c| c.is_whitespace()) {
        Err(Error::Incorrect("ISBN should not contain whitespace characters.".into()))
    } else {
        match id.parse::<Isbn>() {
            Ok(_) => Ok(()),
            Err(e) => Err(Error::Incorrect(format!("ISBN incorrect: {:?}", e))),
        }
    }
}

/// Check Mangrove Review Signature, which is a unique id of a review.
fn check_maresi(conn: &DbConn, sub: &str) -> Result<(), Error> {
    if let Some(id) = sub.split(':').nth(2) {
        conn.select(id).map(|_| ())
    } else {
        Err(Error::Incorrect(format!("No signature found: {}", sub)))
    }
}

pub fn validate_sub(sub: &str) -> Result<(String, UncertainPoint), Error> {
    let uri = Url::parse(&sub)?;
    match uri.scheme() {
        "urn" => {
            let sub = Url::parse(uri.path())?;
            // Parsing lower cases the scheme.
            match sub.scheme() {
                "lei" => check_lei(sub.path()),
                "isbn" => check_isbn(sub.path()),
                // This scheme is only checked with database.
                "maresi" => Ok(()),
                s => Err(Error::Incorrect(format!("Unknown URN scheme: {}", s))),
            }?;
            Ok((format!("{}:{}", uri.scheme(), sub.scheme()), Default::default()))
        },
        "geo" => check_place(&uri)
            .map(|p| (uri.scheme().into(), p)).map_err(Into::into),
        "https" => check_url(&uri)
            .map(|_| (uri.scheme().into(), Default::default()))
            .map_err(Into::into),
        s => Err(Error::Incorrect(format!("Unknown URI scheme: {}", s))),
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
    fn test_uri() {
        check_place(&Url::parse("geo:0,0?u=30&q=47.1691576,8.514572(Juanitos)").unwrap()).unwrap();
        assert!(check_place(&Url::parse("geo:?u=30&q=47.1691576,8.514572(Juanitos)").unwrap()).is_err());
        assert!(check_place(&Url::parse("geo:37.78,-122.399").unwrap()).is_err());
    }
}
