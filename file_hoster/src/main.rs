#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate log;
extern crate hex;
#[macro_use] extern crate rocket;
extern crate rocket_multipart_form_data;

use std::io;
use std::fs::{File, rename};
use std::path::{Path, PathBuf};
use sha2::{Digest, Sha256};
use rocket::Data;
use rocket::response::NamedFile;
use rocket::http::ContentType;
use rocket::http::Method;
use rocket_cors::{AllowedHeaders, AllowedOrigins};
use rocket_contrib::json::Json;
use rocket_multipart_form_data::{
    MultipartFormData, SingleFileField, MultipartFormDataField,
    MultipartFormDataOptions,
    FileField,
};

const TEMP: &str = "files/temp/";
const FILES: &str = "files/";
const FORM_FILE: &str = "files";

fn save_file(data: &SingleFileField) -> Result<String, io::Error> {
    let mut hasher = Sha256::new();
    let mut file = File::open(&data.path)?;
    io::copy(&mut file, &mut hasher)?;
    let hash = hex::encode(&hasher.result()[..]);
    rename(&data.path, Path::new(TEMP).join(hash.clone()))?;
    Ok(hash)
}

#[post("/upload", data = "<data>")]
fn upload(content_type: &ContentType, data: Data) -> Result<Json<Vec<String>>, String> {
    let mut options = MultipartFormDataOptions::new();
    // Allow for up to 5 pictures to be uploaded.
    options.allowed_fields.push(MultipartFormDataField::file(FORM_FILE));
    options.allowed_fields.push(MultipartFormDataField::file(FORM_FILE));
    options.allowed_fields.push(MultipartFormDataField::file(FORM_FILE));
    options.allowed_fields.push(MultipartFormDataField::file(FORM_FILE));
    options.allowed_fields.push(MultipartFormDataField::file(FORM_FILE));
    let multipart_data = MultipartFormData::parse(content_type, data, options)
        .map_err(|e| format!("Data parse error: {:?}", e))?;
    info!("Request data: {:?}", multipart_data.files);
    let files = multipart_data
        .files
        .get(FORM_FILE)
        // TODO: Prove that this never happens.
        .ok_or("Internal server error: file key not found.")?;
    match files {
        FileField::Single(raw) => save_file(raw).map(|h| Json(vec![h])),
        FileField::Multiple(raws) => raws
            .iter()
            .map(save_file)
            .collect::<Result<Vec<String>, io::Error>>()
            .map(Json),
    }.map_err(|e| e.to_string())
}

#[get("/")]
fn index() -> NamedFile {
    NamedFile::open("src/index.html").expect("Index file is always present.")
}

#[get("/exists/<file..>")]
fn exists(file: PathBuf) -> String {
    if Path::new(FILES).join(&file).exists() {
        true
    } else if Path::new(TEMP).join(&file).exists() {
        if let Err(e) = rename(
            &Path::new(TEMP).join(&file),
            Path::new(FILES).join(&file)
        ) {
            warn!("Unable to make the file permanent: {}", e);
            false
        } else {
            true
        }
    } else {
        false
    }.to_string()
}

#[get("/<file..>", rank = 6)]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new(FILES).join(&file))
        .or_else(|_| NamedFile::open(Path::new(TEMP).join(file))).ok()
}

fn main() {
    let allowed_origins = AllowedOrigins::some_regex(&["^http://localhost(.*)"]);
    let cors = rocket_cors::CorsOptions {
        allowed_origins,
        allowed_methods: vec![Method::Post].into_iter().map(From::from).collect(),
        allowed_headers: AllowedHeaders::some(&["Authorization", "Accept"]),
        allow_credentials: true,
        ..Default::default()
    }
    .to_cors().expect("CORS configuration correct.");

    rocket::ignite()
        .mount("/", routes![index, upload, exists, files])
        .attach(cors)
        .launch();
}