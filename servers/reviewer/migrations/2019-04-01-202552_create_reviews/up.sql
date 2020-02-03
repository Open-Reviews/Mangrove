-- Your SQL goes here
CREATE TABLE reviews (
  signature text PRIMARY KEY,
  jwt text NOT NULL,
  kid text NOT NULL,
  iat bigint NOT NULL,
  sub text NOT NULL,
  rating smallint,
  opinion text,
  extra_hashes text,
  metadata text
);