fn main() {
    dotenv::dotenv().expect("Could not read .env");
    reviewer::rocket().launch();
}
