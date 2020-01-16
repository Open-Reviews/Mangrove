use reviewer;
use rocket_lamb::RocketExt;

fn main() {
    reviewer::rocket().lambda().launch();
}
