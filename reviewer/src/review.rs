use std::collections::HashMap;
use std::time::{UNIX_EPOCH, SystemTime, Duration};
use ring::signature;
use xmltree::Element;
use serde::{Serialize, Deserialize};
use url::Url;
use super::error::Error;
use super::schema::reviews;
use super::database::DbConn;

pub type Version = i16;
pub type Rating = i16;
/// OSM node id.
pub type LocationId = i64;

const V1: Version = 1;
const MAX_RATING: Rating = 100;
const MAX_REVIEW_LENGTH: usize = 500;

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct ExtraHashes(
    Vec<String>
);

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Metadata(
    HashMap<String, String>
);

#[derive(Debug, PartialEq, Serialize, Deserialize, Identifiable, Insertable, Queryable)]
pub struct Review {
    pub signature: String,
    pub version: Version,
    pub publickey: String,
    pub timestamp: i64,
    pub idtype: String,
    pub id: String,
    pub rating: Option<Rating>,
    pub opinion: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extradata: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

fn verify_version(version: Version) -> Result<(), Error> {
    if version == V1 {
        Ok(())
    } else {
        Err(Error::Verification(
            "Only version 1 of Mangrove Data Format is supported.".into()
        ))
    }
}

fn verify_timestamp(timestamp: Duration) -> Result<(), Error> {
    let unix_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("SystemTime is not before UNIX EPOCH.");
    if unix_time < timestamp {
        Err(Error::Verification("Claim from the future.".into()))
    } else {
        Ok(())
    }
}

fn verify_rating(rating: Rating) -> Result<(), Error> {
    if rating == 0 || rating > MAX_RATING {
        Err(Error::Verification("Rating out of range.".into()))
    } else {
        Ok(())
    }
}

fn verify_opinion(opinion: &str) -> Result<(), Error> {
    if opinion.len() <= MAX_REVIEW_LENGTH {
        Ok(())
    } else {
        Err(Error::Verification("Opinion too long.".into()))
    }
}

#[derive(Serialize, PartialEq, Debug)]
struct UnsignedReview<'a> {
    version: Version,
    publickey: &'a str,
    timestamp: i64,
    idtype: &'a str,
    id: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    rating: Option<Rating>,
    #[serde(skip_serializing_if = "Option::is_none")]
    opinion: Option<&'a String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    extradata: Option<ExtraHashes>,
    #[serde(skip_serializing_if = "Option::is_none")]
    metadata: Option<Metadata>,
}

fn verify_signature(msg: &UnsignedReview, sig: &str) -> Result<(), Error> {
    info!("Unsigned review: {:?}", serde_json::to_string(msg));
    let pubkey_bytes = hex::decode(&msg.publickey)?;
    let sig_bytes = hex::decode(&sig)?;
    let msg_bytes = serde_cbor::to_vec(msg)?;
    let pubkey = untrusted::Input::from(&pubkey_bytes);
    let msg = untrusted::Input::from(&msg_bytes);
    let sig = untrusted::Input::from(&sig_bytes);
    signature::verify(&signature::ECDSA_P256_SHA256_FIXED, pubkey, msg, sig).map_err(Into::into)
}

fn verify_location(id: &str) -> Result<(), Error> {
    let response = reqwest::get(&format!("https://www.openstreetmap.org/api/0.6/node/{}", id))?
        .text()?;
    if Element::parse(response.as_bytes())?
        .children
        .first()
        .ok_or_else(|| Error::Internal("No XML child.".into()))?
        .attributes
        .get("visible")
        .ok_or_else(|| Error::Verification("Node has no \"visible\" attribute.".into()))?
        == "true" {
        Ok(())
    } else {
        Err(Error::Verification("Node is not visible".into()))
    }
}


fn verify_url(id: &str) -> Result<(), url::ParseError> {
    Url::parse(id).map(|_| ())
}

fn verify_lei(id: &str) -> Result<(), Error> {
    let response: String = reqwest::get(
        &format!("https://api.gleif.org/api/v1/lei-records/{}", id)
    )?
    .text()?;
    serde_json::from_str(&response)?;
    Ok(())
}

// TODO: check in the database
// Verify Mangrove Review Signature, which is a unique id of a review.
fn verify_maresi(conn: &DbConn, id: &str) -> Result<(), Error> {
    conn.select(id).map(|_| ())
}

fn verify_id(conn: &DbConn, idtype: &str, id: &str) -> Result<(), Error> {
    match idtype {
        "OLC+place" => verify_location(id).map_err(Into::into),
        "URL" => verify_url(id).map_err(Into::into),
        "LEI" => verify_lei(id),
        "MaReSi" => verify_maresi(conn, id),
        _ => Err(Error::Verification(format!("Unknown idType: {}", idtype))),
    }

}

fn verify_extrahash(hash: &str) -> Result<(), Error> {
    let exists = reqwest::get(&format!("http://localhost:8001/exists/{}", hash))?
        .text()?
        .parse()?;
    if exists {
        Ok(())
    } else {
        Err(Error::Verification(
            format!("No file with such hash has been uploaded: {:?}", hash)
        ))
    }
}

fn verify_short_string(key: &str, value: &str) -> Result<(), Error> {
    if value.len() > 20 {
        Err(Error::Verification(format!("Field {} is too long.", key)))
    } else {
        Ok(())
    }
}

fn verify_metadata(key: &str, value: &str) -> Result<(), Error> {
    match key {
        "originURI" => match Url::parse(value) {
            Ok(_) => Ok(()),
            Err(e) => Err(
                Error::Verification(format!("Unable to parse originURI: {}", e))
            ),
        },
        "accountName" => verify_short_string(key, value),
        "displayName" => verify_short_string(key, value),
        "age" => match value.parse::<u8>() {
            Ok(n) if n <= 200 => Ok(()),
            _ => Err(Error::Verification("Provided age is incorrect.".into())),
        },
        "birthday" => verify_short_string(key, value),
        "lastName" => verify_short_string(key, value),
        "firstName" => verify_short_string(key, value),
        "gender" => verify_short_string(key, value),
        "openid" => verify_short_string(key, value),
        _ => Err(Error::Verification(
            "Key is not one of Mangrove Core Metadata Keys.".into()
        )),
    }
}

// TODO: verify metadata and extradata
impl Review {
    pub fn verify(&self, conn: &DbConn) -> Result<bool, Error> {
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
            idtype: &self.idtype,
            id: &self.id,
            rating: self.rating,
            opinion: self.opinion.as_ref(),
            extradata,
            metadata,
        };
        verify_version(self.version)?;
        verify_timestamp(Duration::from_secs(self.timestamp as u64))?;
        if self.rating.is_none() && self.opinion.is_none() {
            return Err(Error::Verification(
                "Review must contain either a rating or a review.".into()
            ));
        }
        self.rating.map_or(Ok(()), verify_rating)?;
        self.opinion.as_ref().map_or(Ok(()), |s| verify_opinion(&s))?;
        msg.metadata.as_ref().map_or(
            Ok(()),
            |m| m.0
                .iter()
                .map(|(k, v)| verify_metadata(k, v))
                .collect()
        )?;
        verify_signature(&msg, &self.signature).map_err(|e| { info!("{:?}", e); e })?;
        msg.extradata.map_or(
            Ok(()),
            |e| e.0.iter().map(|h| verify_extrahash(&h)).collect()
        )?;
        verify_id(conn, &self.idtype, &self.id)?;
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verification() {
        let pubkey = untrusted::Input::from(&[4, 253, 66, 207, 28, 80, 88, 205, 80, 193, 228, 51, 157, 213, 215, 192, 1, 9, 132, 22, 113, 148, 88, 74, 30, 114, 138, 210, 81, 120, 37, 204, 33, 207, 1, 215, 76, 125, 15, 71, 120, 25, 47, 210, 116, 199, 156, 233, 204, 9, 217, 251, 226, 88, 107, 121, 219, 41, 38, 138, 34, 188, 123, 112, 126]);
        let msg = untrusted::Input::from(&[166,103,118,101,114,115,105,111,110,1,105,112,117,98,108,105,99,107,101,121,120,130,48,52,102,100,52,50,99,102,49,99,53,48,53,56,99,100,53,48,99,49,101,52,51,51,57,100,100,53,100,55,99,48,48,49,48,57,56,52,49,54,55,49,57,52,53,56,52,97,49,101,55,50,56,97,100,50,53,49,55,56,50,53,99,99,50,49,99,102,48,49,100,55,52,99,55,100,48,102,52,55,55,56,49,57,50,102,100,50,55,52,99,55,57,99,101,57,99,99,48,57,100,57,102,98,101,50,53,56,54,98,55,57,100,98,50,57,50,54,56,97,50,50,98,99,55,98,55,48,55,101,105,116,105,109,101,115,116,97,109,112,26,93,157,246,255,102,105,100,116,121,112,101,99,85,82,76,98,105,100,113,104,116,116,112,58,47,47,103,111,111,103,108,101,46,99,111,109,102,114,97,116,105,110,103,24,50]);
        let sig = untrusted::Input::from(&[194, 167, 81, 117, 30, 229, 244, 238, 28, 127, 29, 111, 138, 117, 234, 216, 111, 34, 188, 145, 122, 9, 160, 165, 97, 181, 161, 195, 99, 150, 130, 75, 48, 170, 116, 73, 69, 89, 231, 128, 67, 191, 45, 35, 104, 86, 106, 98, 111, 182, 114, 75, 96, 50, 99, 90, 127, 241, 155, 0, 0, 121, 154, 77]);
        assert!(signature::verify(&signature::ECDSA_P256_SHA256_FIXED, pubkey, msg, sig).is_ok());
    }
}
