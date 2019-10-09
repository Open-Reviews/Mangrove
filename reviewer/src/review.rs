use std::collections::HashMap;
use std::time::{UNIX_EPOCH, SystemTime, Duration};
use ring::signature;
use xmltree::Element;
use serde::{Serialize, Deserialize};
use url::Url;
use super::schema::reviews;

pub type Version = i16;
pub type Rating = i16;
/// OSM node id.
pub type LocationId = i64;

const V1: Version = 1;
const MAX_RATING: Rating = 100;
const MAX_REVIEW_LENGTH: usize = 500;

#[derive(Debug, FromForm, Serialize, Insertable, Queryable)]
#[table_name="reviews"]
pub struct Review {
    pub signature: String,
    pub version: Version,
    pub publickey: String,
    pub timestamp: i64,
    pub idtype: String,
    pub id: String,
    pub rating: Option<Rating>,
    pub opinion: Option<String>,
    // JSON vector of hashes.
    pub extradata: Option<String>,
    // JSON dictionary.
    pub metadata: Option<String>,
}

fn verify_version(version: Version) -> Result<(), String> {
    if version == V1 {
        Ok(())
    } else {
        Err("Only version 1 of Mangrove Data Format is supported.".into())
    }
}

fn verify_timestamp(timestamp: Duration) -> Result<(), String> {
    let unix_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("SystemTime is not before UNIX EPOCH.");
    if unix_time < timestamp {
        Err("Claim from the future.".into())
    } else {
        Ok(())
    }
}

fn verify_rating(rating: Rating) -> Result<(), String> {
    if rating == 0 || rating > MAX_RATING {
        Err("Rating out of range.".into())
    } else {
        Ok(())
    }
}

fn verify_opinion(opinion: &str) -> Result<(), String> {
    if opinion.len() <= MAX_REVIEW_LENGTH {
        Ok(())
    } else {
        Err("Opinion too long.".into())
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug)]
struct ExtraData(Vec<String>);

#[derive(Serialize, Deserialize, PartialEq, Debug)]
struct MetaData(HashMap<String, String>);

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
    extradata: Option<ExtraData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    metadata: Option<MetaData>,
}

#[derive(Debug)]
enum SignatureError {
    Hex(hex::FromHexError),
    Cbor(serde_cbor::error::Error),
    Ring(ring::error::Unspecified),
}

impl From<SignatureError> for String {
    fn from(error: SignatureError) -> Self {
        format!("{:?}", error)
    }
}

impl From<hex::FromHexError> for SignatureError {
    fn from(error: hex::FromHexError) -> Self {
        SignatureError::Hex(error)
    }
}

impl From<serde_cbor::error::Error> for SignatureError {
    fn from(error: serde_cbor::error::Error) -> Self {
        SignatureError::Cbor(error) 
    }
}

impl From<ring::error::Unspecified> for SignatureError {
    fn from(error: ring::error::Unspecified) -> Self {
        SignatureError::Ring(error) 
    }
}

fn verify_signature(msg: &UnsignedReview, sig: &str) -> Result<(), SignatureError> {
    let pubkey_bytes = hex::decode(&msg.publickey)?;
    let sig_bytes = hex::decode(&sig)?;
    let msg_bytes = serde_cbor::to_vec(&msg)?;
    let pubkey = untrusted::Input::from(&pubkey_bytes);
    let msg = untrusted::Input::from(&msg_bytes);
    let sig = untrusted::Input::from(&sig_bytes);
    signature::verify(&signature::ED25519, pubkey, msg, sig).map_err(Into::into)
}

#[derive(Debug)]
pub enum LocationError {
    Request(reqwest::Error),
    Parse(xmltree::ParseError),
    NoNode(String),
}

impl From<LocationError> for String {
    fn from(error: LocationError) -> Self {
        format!("{:?}", error)
    }
}

impl From<reqwest::Error> for LocationError {
    fn from(error: reqwest::Error) -> Self {
        LocationError::Request(error)
    }
}

impl From<xmltree::ParseError> for LocationError {
    fn from(error: xmltree::ParseError) -> Self {
        LocationError::Parse(error)
    }
}

#[derive(Debug)]
pub enum IdError {
    Location(LocationError),
    URL(url::ParseError),
    UnknownMaReSi,
    UnknownType,
}

impl From<IdError> for String {
    fn from(error: IdError) -> Self {
        format!("{:?}", error)
    }
}

impl From<LocationError> for IdError {
    fn from(error: LocationError) -> Self {
        IdError::Location(error)
    }
}

impl From<url::ParseError> for IdError {
    fn from(error: url::ParseError) -> Self {
        IdError::URL(error)
    }
}

fn verify_location(id: &str) -> Result<(), LocationError> {
    let response = reqwest::get(&format!("https://www.openstreetmap.org/api/0.6/node/{}", id))?
        .text()?;
    if Element::parse(response.as_bytes())?
        .children
        .first()
        .ok_or_else(|| LocationError::NoNode("No XML child.".into()))?
        .attributes
        .get("visible")
        .ok_or_else(|| LocationError::NoNode("Node has no \"visible\" attribute.".into()))?
        == "true" {
        Ok(())
    } else {
        Err(LocationError::NoNode("Node is not visible".into()))
    }
}

fn verify_url(id: &str) -> Result<(), url::ParseError> {
    Url::parse(id).map(|_| ())
}

// TODO: check in the database
// Verify Mangrove Review Signature, which is a unique id of a review.
fn verify_maresi(id: &str) -> Result<(), IdError> {
    Ok(())
}

fn verify_id(idtype: &str, id: &str) -> Result<(), IdError> {
    match idtype {
        "OLC+place" => verify_location(id).map_err(Into::into),
        "URL" => verify_url(id).map_err(Into::into),
        "MaReSi" => verify_maresi(id),
        _ => Err(IdError::UnknownType),
    }

}

fn verify_extrahash(hash: &str) -> Result<(), String> {
    if false {
        Err(format!("No file with such hash has been uploaded: {:?}", hash))
    } else {
        Ok(())
    }
}

fn verify_metadata(key: &str, value: &str) -> Result<(), String> {
    match key {
        "originURI" => Ok(()), // MUST be a correct URI corresponding to the resource the review originates from: website or app.
        "accountName" => Ok(()), // MUST be a name of account used for this review.
        "displayName" => Ok(()), // MUST be a user specified name to be displayed.
        "age" => Ok(()), // MUST be of Major type 0 (an unsigned integer) which SHOULD be the age of the reviewer of at most 200.
        "birthday" => Ok(()), // SHOULD be the date of birth of the reviewer.
        "lastName" => Ok(()), // SHOULD be the last name of the reviewer.
        "firstName" => Ok(()), // SHOULD be the first name of the reviewer.
        "gender" => Ok(()), // SHOULD be the gender of the reviewer.
        "openid" => Ok(()), // SHOULD be the openid associated with the reviewer.
        _ => Err("Key is not one of Mangrove Core Metadata Keys.".into()),
    }
}

// TODO: verify metadata and extradata
impl Review {
    pub fn verify(&self) -> Result<bool, String> {
        let extradata = match self.extradata {
            Some(ref s) => serde_json::from_str(s).map_err(|e| e.to_string())?,
            None => None,
        };
        let metadata = match self.metadata {
            Some(ref s) => serde_json::from_str(s).map_err(|e| e.to_string())?,
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
            return Err("Review must contain either a rating or a review.".into());
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
        verify_signature(&msg, &self.signature)?;
        msg.extradata.map_or(
            Ok(()),
            |e| e.0.iter().map(|h| verify_extrahash(&h)).collect()
        )?;
        verify_id(&self.idtype, &self.id)?;
        Ok(true)
    }
}