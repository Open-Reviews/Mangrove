use file_hoster;
use rocket_lamb::RocketExt;

fn main() {
    file_hoster::rocket().lambda().launch();
}