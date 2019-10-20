table! {
    reviews (signature) {
        signature -> Text,
        version -> Int2,
        publickey -> Text,
        timestamp -> Int8,
        uri -> Text,
        rating -> Nullable<Int2>,
        opinion -> Nullable<Text>,
        extradata -> Nullable<Jsonb>,
        metadata -> Nullable<Jsonb>,
    }
}
