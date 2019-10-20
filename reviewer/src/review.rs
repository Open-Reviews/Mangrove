use super::database::DbConn;
use super::error::Error;
use super::schema::reviews;
use ring::signature;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use url::Url;

pub type Version = i16;
pub type Rating = i16;

const V1: Version = 1;
const MAX_RATING: Rating = 100;
const MAX_REVIEW_LENGTH: usize = 500;

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct ExtraHashes(Vec<String>);

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Metadata(HashMap<String, String>);

#[derive(Debug, PartialEq, Serialize, Deserialize, Identifiable, Insertable, Queryable)]
#[primary_key(signature)]
pub struct Review {
    pub signature: String,
    pub version: Version,
    pub publickey: String,
    pub timestamp: i64,
    pub uri: String,
    pub rating: Option<Rating>,
    pub opinion: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extradata: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Serialize, PartialEq, Debug)]
struct UnsignedReview<'a> {
    version: Version,
    publickey: &'a str,
    timestamp: i64,
    uri: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    rating: Option<Rating>,
    #[serde(skip_serializing_if = "Option::is_none")]
    opinion: Option<&'a String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    extradata: Option<ExtraHashes>,
    #[serde(skip_serializing_if = "Option::is_none")]
    metadata: Option<Metadata>,
}

fn check_version(version: Version) -> Result<(), Error> {
    if version == V1 {
        Ok(())
    } else {
        Err(Error::Incorrect(
            "Only version 1 of Mangrove Data Format is supported.".into(),
        ))
    }
}

fn check_timestamp(timestamp: Duration) -> Result<(), Error> {
    let unix_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("SystemTime is not before UNIX EPOCH.");
    if unix_time < timestamp {
        Err(Error::Incorrect("Claim from the future.".into()))
    } else {
        Ok(())
    }
}

fn check_rating(rating: Rating) -> Result<(), Error> {
    if rating == 0 || rating > MAX_RATING {
        Err(Error::Incorrect("Rating out of range.".into()))
    } else {
        Ok(())
    }
}

fn check_opinion(opinion: &str) -> Result<(), Error> {
    if opinion.len() <= MAX_REVIEW_LENGTH {
        Ok(())
    } else {
        Err(Error::Incorrect("Opinion too long.".into()))
    }
}

fn check_signature(msg: &UnsignedReview, sig: &str) -> Result<(), Error> {
    info!("Unsigned review: {:?}", serde_json::to_string(msg));
    let pubkey_bytes = hex::decode(&msg.publickey)?;
    let sig_bytes = hex::decode(&sig)?;
    let msg_bytes = serde_cbor::to_vec(msg)?;
    let pubkey = untrusted::Input::from(&pubkey_bytes);
    let msg = untrusted::Input::from(&msg_bytes);
    let sig = untrusted::Input::from(&sig_bytes);
    signature::verify(&signature::ECDSA_P256_SHA256_FIXED, pubkey, msg, sig).map_err(Into::into)
}

fn check_place(geo: &Url) -> Result<(), Error> {
    let mut coords = geo.path().split(',').map(|s| s.parse());
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
    if geo.fragment().is_none() {
        return Err(Error::Incorrect("Place must specify a name.".into()));
    }
    Ok(())
    // Move working with OSM to frontend.
    /*
    let response = reqwest::get(&format!("https://www.openstreetmap.org/api/0.6/node/{}", id))?
        .text()?;
    if Element::parse(response.as_bytes())?
        .children
        .first()
        .ok_or_else(|| Error::Internal("No XML child.".into()))?
        .attributes
        .get("visible")
        .ok_or_else(|| Error::Incorrect("Node has no \"visible\" attribute.".into()))?
        == "true" {
        Ok(())
    } else {
        Err(Error::Incorrect("Node is not visible".into()))
    }
    */
}

fn check_url(id: &str) -> Result<(), url::ParseError> {
    Url::parse(id).map(|_| ())
}

fn check_lei(id: &str) -> Result<(), Error> {
    let response: String =
        reqwest::get(&format!("https://api.gleif.org/api/v1/lei-records/{}", id))?.text()?;
    serde_json::from_str(&response)?;
    Ok(())
}

// TODO: check in the database
// check Mangrove Review Signature, which is a unique id of a review.
fn check_maresi(conn: &DbConn, id: &str) -> Result<(), Error> {
    conn.select(id).map(|_| ())
}

fn check_uri(conn: &DbConn, uri: &str) -> Result<(), Error> {
    let parsed = Url::parse(&uri)?;
    match parsed.scheme() {
        "urn" => {
            let sub = Url::parse(parsed.path())?;
            match sub.scheme() {
                "lei" => check_lei(sub.path()),
                "maresi" => check_maresi(conn, sub.path()),
                s => Err(Error::Incorrect(format!("Unknown URN scheme: {}", s))),
            }
        }
        "geo" => check_place(&parsed).map_err(Into::into),
        "http" | "https" => check_url(uri).map_err(Into::into),
        s => Err(Error::Incorrect(format!("Unknown URI scheme: {}", s))),
    }
}

fn check_extrahash(hash: &str) -> Result<(), Error> {
    let exists = reqwest::get(&format!("http://localhost:8001/exists/{}", hash))?
        .text()?
        .parse()?;
    if exists {
        Ok(())
    } else {
        Err(Error::Incorrect(format!(
            "No file with such hash has been uploaded: {:?}",
            hash
        )))
    }
}

fn check_short_string(key: &str, value: &str) -> Result<(), Error> {
    if value.len() > 20 {
        Err(Error::Incorrect(format!("Field {} is too long.", key)))
    } else {
        Ok(())
    }
}

fn check_metadata(key: &str, value: &str) -> Result<(), Error> {
    match key {
        "originURI" => match Url::parse(value) {
            Ok(_) => Ok(()),
            Err(e) => Err(Error::Incorrect(format!(
                "Unable to parse originURI: {}",
                e
            ))),
        },
        "accountName" => check_short_string(key, value),
        "displayName" => check_short_string(key, value),
        "age" => match value.parse::<u8>() {
            Ok(n) if n <= 200 => Ok(()),
            _ => Err(Error::Incorrect("Provided age is incorrect.".into())),
        },
        "birthday" => check_short_string(key, value),
        "lastName" => check_short_string(key, value),
        "firstName" => check_short_string(key, value),
        "gender" => check_short_string(key, value),
        "openid" => check_short_string(key, value),
        _ => Err(Error::Incorrect(
            "Key is not one of Mangrove Core Metadata Keys.".into(),
        )),
    }
}

// TODO: check metadata and extradata
impl Review {
    pub fn check(&self, conn: &DbConn) -> Result<bool, Error> {
        let extradata = match self.extradata {
            Some(ref v) => serde_json::from_value(v.clone())?,
            None => None,
        };
        let metadata = match self.metadata {
            Some(ref v) => serde_json::from_value(v.clone())?,
            None => None,
        };
        let msg = UnsignedReview {
            version: self.version,
            publickey: &self.publickey,
            timestamp: self.timestamp,
            uri: &self.uri,
            rating: self.rating,
            opinion: self.opinion.as_ref(),
            extradata,
            metadata,
        };
        check_version(self.version)?;
        check_timestamp(Duration::from_secs(self.timestamp as u64))?;
        if self.rating.is_none() && self.opinion.is_none() {
            return Err(Error::Incorrect(
                "Review must contain either a rating or a review.".into(),
            ));
        }
        self.rating.map_or(Ok(()), check_rating)?;
        self.opinion
            .as_ref()
            .map_or(Ok(()), |s| check_opinion(&s))?;
        msg.metadata.as_ref().map_or(Ok(()), |m| {
            m.0.iter().map(|(k, v)| check_metadata(k, v)).collect()
        })?;
        check_signature(&msg, &self.signature).map_err(|e| {
            info!("{:?}", e);
            e
        })?;
        msg.extradata.map_or(Ok(()), |e| {
            e.0.iter().map(|h| check_extrahash(&h)).collect()
        })?;
        check_uri(conn, &self.uri)?;
        Ok(true)
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
        assert!(check_place(&Url::parse("geo:37.78,-122.399#Juanitos").unwrap()).is_ok());
        assert!(check_place(&Url::parse("geo:37.78,-122.399").unwrap()).is_err());
    }
}
