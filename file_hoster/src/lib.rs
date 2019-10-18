#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate log;
#[macro_use]
extern crate lazy_static;
#[macro_use]
extern crate rocket;

use rocket::http::{ContentType, Method};
use rocket::{Data, Rocket};
use rocket_contrib::json::Json;
use rocket_multipart_form_data::{
    FileField, MultipartFormData, MultipartFormDataField, MultipartFormDataOptions, SingleFileField,
};
use rusoto_s3::{DeleteObjectTaggingRequest, PutObjectRequest, S3Client, S3};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Read};
use std::path::{Path, PathBuf};

const FILES: &str = "files";
const BUCKET: &str = "files.mangrove.network";

lazy_static! {
    /*
    static ref STORE: &'static Path = {
        fs::create_dir("/tmp/files").expect("Access to tmp is missing.");
        Path::new("/tmp")
    };
    */
    static ref STORE: S3Client = S3Client::new(Default::default());
}

// Compute hex encoded SHA256 of the file.
fn hash(data: &SingleFileField) -> Result<String, io::Error> {
    let mut hasher = Sha256::new();
    let mut file = File::open(&data.path)?;
    io::copy(&mut file, &mut hasher)?;
    Ok(hex::encode(&hasher.result()[..]))
}

trait HashingStore {
    // Put file in temporary storage under its hash and return hash.
    fn save(&self, data: &SingleFileField) -> Result<String, String>;

    // Return true if file is known, otherwise false.
    // Move file to permanent storage if currently in temporary.
    fn persist(&self, file: &PathBuf) -> bool;
}

impl HashingStore for &Path {
    fn save(&self, data: &SingleFileField) -> Result<String, String> {
        let hash = hash(data).map_err(|e| e.to_string())?;
        if !Path::new(FILES).join(&hash).exists() {
            let temp_path = self.join(&hash);
            if !temp_path.exists() {
                fs::rename(&data.path, temp_path).map_err(|e| e.to_string())?;
            }
        }
        Ok(hash)
    }

    fn persist(&self, file: &PathBuf) -> bool {
        let files = self.join(FILES);
        if files.join(&file).exists() {
            true
        } else if self.join(&file).exists() {
            if let Err(e) = fs::rename(&self.join(&file), files.join(&file)) {
                warn!("Unable to make the file permanent: {}", e);
                false
            } else {
                true
            }
        } else {
            false
        }
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

    fn persist(&self, file: &PathBuf) -> bool {
        self.delete_object_tagging(DeleteObjectTaggingRequest {
            bucket: BUCKET.into(),
            key: file.to_string_lossy().into(),
            version_id: None,
        })
        .sync()
        .is_ok()
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
    "Check out for project information: https://planting.space/mangrove.html"
}

#[get("/exists/<file..>")]
fn exists(file: PathBuf) -> String {
    STORE.persist(&file).to_string()
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
        .mount("/", routes![index, upload, exists])
        .attach(cors)
}
