use std::fs::File;
use serde::Serialize;
use serde_json::Value;
use ring::{rand, signature::{KeyPair, EcdsaKeyPair}};

#[derive(Debug, Serialize)]
struct CborReview {
    signature: String,
    payload: String
}

/// Script that takes the base payloads in JSON
/// and constructs signed reviews with CBOR fields.
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open("../payloads-base.json")?;
    let mut payloads: Value = serde_json::from_reader(file)?;
    let rng = rand::SystemRandom::new();
    let algo = &ring::signature::ECDSA_P256_SHA256_FIXED_SIGNING;
    let pkcs8_bytes = EcdsaKeyPair::generate_pkcs8(algo, &rng)
        .map_err(RingError::from)?;

    let key_pair = EcdsaKeyPair::from_pkcs8(algo, pkcs8_bytes.as_ref()).map_err(RingError::from)?;
    let encoded_pk = base64_url::encode(&key_pair.public_key().as_ref());

    let mut reviews = Vec::new();

    for payload in payloads.as_array_mut().expect("Example payloads are an array.") {
        payload["iss"] = Value::String(encoded_pk.clone());
        let payload_cbor = serde_cbor::to_vec(&serde_cbor::value::to_value(&payload)?)?;

        let signature = key_pair.sign(&rng, &payload_cbor).map_err(RingError::from)?;

        reviews.push(CborReview {
            signature: base64_url::encode(signature.as_ref()),
            payload: base64_url::encode(&payload_cbor)
        })
    }

    let file = &File::create("../reviews-rs.json")?;
    serde_json::to_writer_pretty(file, &reviews)?;
    Ok(())
}

#[derive(Debug)]
struct RingError;

impl std::fmt::Display for RingError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "Ring error.")
    }
}

impl std::error::Error for RingError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        None
    }
}

impl From<ring::error::Unspecified> for RingError {
    fn from(_error: ring::error::Unspecified) -> Self {
        RingError
    }
}

impl From<ring::error::KeyRejected> for RingError {
    fn from(_error: ring::error::KeyRejected) -> Self {
        RingError
    }
}