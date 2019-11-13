table! {
    reviews (signature) {
        signature -> Text,
        iss -> Text,
        iat -> Int8,
        sub -> Text,
        rating -> Nullable<Int2>,
        opinion -> Nullable<Text>,
        extradata -> Nullable<Jsonb>,
        metadata -> Nullable<Jsonb>,
    }
}
