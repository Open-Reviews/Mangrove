table! {
    use diesel::sql_types::*;
    use diesel_geography::sql_types::*;

    reviews (signature) {
        signature -> Text,
        jwt -> Text,
        kid -> Text,
        iat -> Int8,
        sub -> Text,
        rating -> Nullable<Int2>,
        opinion -> Nullable<Text>,
        images -> Nullable<Json>,
        metadata -> Nullable<Json>,
        scheme -> Nullable<Text>,
        coordinates -> Nullable<Geography>,
        uncertainty -> Nullable<Int4>,
    }
}

table! {
    use diesel::sql_types::*;
    use diesel_geography::sql_types::*;

    spatial_ref_sys (srid) {
        srid -> Int4,
        auth_name -> Nullable<Varchar>,
        auth_srid -> Nullable<Int4>,
        srtext -> Nullable<Varchar>,
        proj4text -> Nullable<Varchar>,
    }
}

allow_tables_to_appear_in_same_query!(
    reviews,
    spatial_ref_sys,
);
