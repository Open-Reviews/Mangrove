#[derive(Debug, Responder)]
pub enum Error {
    // Issue with the submitted review.
    #[response(status = 400)]
    Verification(String),
    // Internal issue when verifying a review.
    #[response(status = 500)]
    Internal(String),
}

impl From<hex::FromHexError> for Error {
    fn from(error: hex::FromHexError) -> Self {
        Error::Verification(error.to_string())
    }
}

impl From<serde_cbor::error::Error> for Error {
    fn from(error: serde_cbor::error::Error) -> Self {
        Error::Verification(error.to_string()) 
    }
}

impl From<ring::error::Unspecified> for Error {
    fn from(error: ring::error::Unspecified) -> Self {
        Error::Verification(error.to_string()) 
    }
}

impl From<diesel::result::Error> for Error {
    fn from(error: diesel::result::Error) -> Self {
        Error::Internal(error.to_string())
    }
}

// TODO: Differentiate errors.
impl From<reqwest::Error> for Error {
    fn from(error: reqwest::Error) -> Self {
        Error::Verification(error.to_string())
    }
}

impl From<xmltree::ParseError> for Error {
    fn from(error: xmltree::ParseError) -> Self {
        Error::Internal(error.to_string())
    }
}

impl From<url::ParseError> for Error {
    fn from(error: url::ParseError) -> Self {
        Error::Verification(error.to_string())
    }
}

impl From<serde_json::Error> for Error {
    fn from(error: serde_json::Error) -> Self {
        Error::Verification(error.to_string())
    }
}

// Called when calling the Mangrove File Server.
impl From<std::str::ParseBoolError> for Error {
    fn from(error: std::str::ParseBoolError) -> Self {
        Error::Internal(error.to_string())
    }
}