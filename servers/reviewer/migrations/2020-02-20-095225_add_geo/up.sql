-- Your SQL goes here
ALTER TABLE reviews
ADD COLUMN scheme text,
ADD COLUMN coordinates geography(point, 4326),
ADD COLUMN uncertainty int;