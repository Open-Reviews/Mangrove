-- Your SQL goes here
CREATE TABLE reviews (
  signature text PRIMARY KEY,
  iss text NOT NULL,
  iat bigint NOT NULL,
  sub text NOT NULL,
  rating smallint,
  opinion text,
  extradata text,
  metadata text
);