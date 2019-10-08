-- Your SQL goes here
CREATE TABLE reviews (
  signature text PRIMARY KEY,
  version smallint NOT NULL,
  publicKey text NOT NULL,
  timestamp bigint NOT NULL,
  idType text NOT NULL,
  id text NOT NULL,
  rating smallint,
  opinion text,
  extradata text,
  metadata text
)
