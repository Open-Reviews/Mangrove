table! {
    reviews (signature) {
        signature -> Text,
        jwt -> Text,
        kid -> Text,
        iat -> Int8,
        sub -> Text,
        rating -> Nullable<Int2>,
        opinion -> Nullable<Text>,
        extra_hashes -> Nullable<Json>,
        metadata -> Nullable<Json>,
    }
}
