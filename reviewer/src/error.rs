use okapi::openapi3::Responses;
use rocket_okapi::gen::OpenApiGenerator;
use rocket_okapi::response::OpenApiResponder;
use rocket_okapi::util::add_schema_response;
use rocket_okapi::Result as ApiResult;
use base64_url::base64;
use std::fmt::Debug;

#[derive(Debug, Responder)]
pub enum Error {
    // Issue with the submitted review.
    #[response(status = 400)]
    Incorrect(String),
    // Internal issue when checking a review.
    #[response(status = 500)]
    Internal(String),
}

impl<'r> OpenApiResponder<'r> for Error {
    fn responses(gen: &mut OpenApiGenerator) -> ApiResult<Responses> {
        let mut responses = Responses::default();
        let schema = gen.json_schema::<String>();
        add_schema_response(&mut responses, 400, "text/plain", schema.clone())?;
        add_schema_response(&mut responses, 500, "text/plain", schema)?;
        Ok(responses)
    }
}

impl From<base64::DecodeError> for Error {
    fn from(error: base64::DecodeError) -> Self {
        Error::Incorrect(format!("Incorrect base64url encoding: {}", error))
    }
}

impl From<serde_cbor::error::Error> for Error {
    fn from(error: serde_cbor::error::Error) -> Self {
        Error::Incorrect(format!("Incorrect CBOR encoding: {}", error))
    }
}

impl From<ring::error::Unspecified> for Error {
    fn from(error: ring::error::Unspecified) -> Self {
        Error::Incorrect(format!("Incorrect signature: {}", error))
    }
}

impl From<diesel::result::Error> for Error {
    fn from(error: diesel::result::Error) -> Self {
        Error::Internal(format!("Database error: {}", error))
    }
}

// TODO: Differentiate errors.
impl From<reqwest::Error> for Error {
    fn from(error: reqwest::Error) -> Self {
        Error::Incorrect(format!("Non-existent entity: {}", error))
    }
}

impl From<std::io::Error> for Error {
    fn from(error: std::io::Error) -> Self {
        Error::Incorrect(format!("Incorrect CBOR string encoding: {}", error))
    }
}

impl From<xmltree::ParseError> for Error {
    fn from(error: xmltree::ParseError) -> Self {
        Error::Internal(error.to_string())
    }
}

impl From<url::ParseError> for Error {
    fn from(error: url::ParseError) -> Self {
        Error::Incorrect(format!("Incorrect URI: {}", error))
    }
}

impl From<serde_json::Error> for Error {
    fn from(error: serde_json::Error) -> Self {
        Error::Incorrect(format!("Incorrect JSON encoding: {}", error))
    }
}

impl From<std::num::ParseFloatError> for Error {
    fn from(error: std::num::ParseFloatError) -> Self {
        Error::Incorrect(format!("Incorrect float representation: {}", error))
    }
}

// Called when calling the Mangrove File Server.
impl From<std::str::ParseBoolError> for Error {
    fn from(error: std::str::ParseBoolError) -> Self {
        Error::Internal(error.to_string())
    }
}
