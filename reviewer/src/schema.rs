table! {
    reviews (signature) {
        signature -> Text,
        version -> Int2,
        publickey -> Text,
        timestamp -> Int8,
        idtype -> Text,
        id -> Text,
        rating -> Nullable<Int2>,
        opinion -> Nullable<Text>,
        extradata -> Nullable<Text>,
        metadata -> Nullable<Text>,
    }
}
