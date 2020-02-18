#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate log;
#[macro_use]
extern crate rocket;

use rocket::http::{ContentType, Method};
use rocket::{Data, Rocket};
use rocket_contrib::json::Json;
use rocket_multipart_form_data::{
    FileField, MultipartFormData, MultipartFormDataField, MultipartFormDataOptions, SingleFileField,
};
use rusoto_s3::{PutObjectRequest, S3Client, S3};
use sha2::{Digest, Sha256};
use once_cell::sync::Lazy;
use std::fs::{self, File};
use std::io::{self, Read};
use std::path::Path;

const FILES: &str = "files";
const BUCKET: &str = "files.mangrove.reviews";

static STORE: Lazy<S3Client> = Lazy::new(|| { S3Client::new(Default::default()) });

/// Compute base64url encoded SHA256 of the file.
fn hash(data: &SingleFileField) -> Result<String, io::Error> {
    let mut hasher = Sha256::new();
    let mut file = File::open(&data.path)?;
    io::copy(&mut file, &mut hasher)?;
    Ok(base64_url::encode(&hasher.result()[..]))
}

trait HashingStore {
    // Put file in temporary storage under its hash and return hash.
    fn save(&self, data: &SingleFileField) -> Result<String, String>;
}

/// Works by using the root Path for temporary files.
impl HashingStore for &Path {
    fn save(&self, data: &SingleFileField) -> Result<String, String> {
        let hash = hash(data).map_err(|e| e.to_string())?;
        if !self.join(FILES).join(&hash).exists() {
            let temp_path = self.join(&hash);
            if !temp_path.exists() {
                info!("Saving file: {}", hash);
                fs::rename(&data.path, temp_path).map_err(|e| e.to_string())?;
            }
        }
        Ok(hash)
    }
}

impl HashingStore for S3Client {
    fn save(&self, data: &SingleFileField) -> Result<String, String> {
        let hash = hash(data).map_err(|e| e.to_string())?;
        let mut file = File::open(&data.path).map_err(|e| e.to_string())?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
        self.put_object(PutObjectRequest {
            bucket: BUCKET.into(),
            key: hash.clone(),
            body: Some(buffer.into()),
            acl: Some("public-read".into()),
            tagging: Some("tmp=true".into()),
            content_type: data.content_type.as_ref().map(|t| t.to_string()),
            ..Default::default()
        })
        .sync()
        .map_err(|e| format!("Error uploading to S3: {}", e))?;
        Ok(hash)
    }
}

#[put("/", data = "<data>")]
fn upload(content_type: &ContentType, data: Data) -> Result<Json<Vec<String>>, String> {
    let mut options = MultipartFormDataOptions::new();
    // Allow for up to 5 pictures to be uploaded.
    options
        .allowed_fields
        .push(MultipartFormDataField::file(FILES));
    options
        .allowed_fields
        .push(MultipartFormDataField::file(FILES));
    options
        .allowed_fields
        .push(MultipartFormDataField::file(FILES));
    options
        .allowed_fields
        .push(MultipartFormDataField::file(FILES));
    options
        .allowed_fields
        .push(MultipartFormDataField::file(FILES));
    let multipart_data = MultipartFormData::parse(content_type, data, options)
        .map_err(|e| format!("Data parse error: {:?}", e))?;
    info!("Request data: {:?}", multipart_data.files);
    let files = multipart_data
        .files
        .get(FILES)
        // TODO: Prove that this never happens.
        .ok_or("Internal server error: file key not found.")?;
    match files {
        FileField::Single(raw) => STORE.save(raw).map(|h| Json(vec![h])),
        FileField::Multiple(raws) => raws
            .iter()
            .map(|f| STORE.save(f))
            .collect::<Result<Vec<String>, String>>()
            .map(Json),
    }
}

#[get("/")]
fn index() -> &'static str {
    "Check out for project information: https://mangrove.reviews"
}

pub fn rocket() -> Rocket {
    let cors = rocket_cors::CorsOptions {
        allowed_methods: vec![Method::Put, Method::Get]
            .into_iter()
            .map(From::from)
            .collect(),
        ..Default::default()
    }
    .to_cors()
    .expect("CORS configuration correct.");

    rocket::ignite()
        .mount("/", routes![index, upload])
        .attach(cors)
}
