table! {
    subjects (sub) {
        sub -> Text,
        quality -> Int2,
    }
}

table! {
    reviewers (pem) {
        pem -> Text,
        neutrality -> Float,
    }
}