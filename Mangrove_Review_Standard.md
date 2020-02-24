# Mangrove Review Standard (MaReSt) v0.2.1

The mission of the Mangrove initiative is to create a public space on the Internet where people can freely share insights with each other and make better decisions based on open data. Mangrove contributes to the Open and Privacy movements by proposing an alternative architecture that is characterized by a **separation of data and products**, and that **respects the right to privacy**:

* The **data**, representing the insights, knowledge and wisdom of the public, is open and freely available to all. As such, it provides a valuable foundation for many use-cases, including research, social or commercial purposes.
* **Products** (i.e., applications and services) built upon crowd-sourced or publicly funded data should make profit based on innovation and technological merit, and not on keeping the data proprietary. An architecture that separates data from products helps remove barriers to entry and avoids information silos.
* The **privacy** of contributors cannot be compromised in Mangrove, as no personally identifiable information and no metadata is collected on the 'data level'. If service providers need to collect user data to enable their services, they may do so in their user interfaces on the 'product level', affecting only those users who trust their particular services. 

We want this open dataset to be as useful as possible, to as many people and organizations as possible. Interoperability of data is an important element to reach this goal. To enable interoperability, we need agreed-upon technical standards. Therefore, the Mangrove initiative proposes the **Mangrove Review Standard** as a way for people to represent insights in the form of reviews. We invite the Open and Privacy communities to contribute to this standard.

The standard was developed based on a set of [principles](#principles-of-the-data-format-specification) that guided the design decisions made.

## Definitions

**Mangrove review** ("Review"): a statement by a reviewer about an subject, whereby the review is provided according to the MaReSt, and contains, among other things, either a rating (a number between 1 and 100) for the subject, or an opinion (a piece of text describing the experience) about the subject, or both.

**Mangrove version**: a version number of the Mangrove Review Standard following the [Semantic Versioning 2.0.0 rules](https://semver.org/).

**Subject**: something that is being reviewed in Mangrove. This can be: a place on a map (e.g., restaurant, hotel, touristic site), a website, or a company.

**Mangrove reviewer** ("Reviewer"): a person or organization who contributes to the Mangrove open dataset by writing a review. A contributor can write a review directly on the Mangrove website, or indirectly through the websites of third-party services or applications that integrate with Mangrove.

**Mangrove user** ("User"): a person or organization that makes use of individual reviews and/or aggregated ratings, by reading them on the Mangrove or a third-party website, or by integrating the Mangrove dataset into a third-party service.

**Aggregation algorithm**: an algorithm that aggregates individual reviews into a single rating for an subject and highlights the most useful ones.

**Mangrove servers**: servers that host data compatible with the Mangrove Review Standard.

**Original Mangrove server**: server maintained by the Mangrove initiative. 

### Changes currently being considered

- Addition of another claim with an object for structured review content beyond rating.
- Removal of `kid` header field once JWK format has more adoption.
- Additional metadata fields: proof-of-purchase, identity token, useful information about the subject.

## Mangrove Review Example

As encoded [JSON Web Token](https://jwt.io/):
```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ii0tLS0tQkVHSU4gUFVCTElDIEtFWS0tLS0tTUZrd0
V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFcDc4Zms1eUNqYmlZYXZ5UjZGQ2xxcTlBRkJUaXpBSG1Z
dU9rcTR3cy9aYmdleG41SVQ2bi83NGt2YlZ0UGxNc3A5Z2luTysxMVZ4ZUorbVFJQ1pZamc9PS0tLS0tRU5EIF
BVQkxJQyBLRVktLS0tLSIsImp3ayI6IntcImNydlwiOlwiUC0yNTZcIixcImV4dFwiOnRydWUsXCJrZXlfb3Bz
XCI6W1widmVyaWZ5XCJdLFwia3R5XCI6XCJFQ1wiLFwieFwiOlwicDc4Zms1eUNqYmlZYXZ5UjZGQ2xxcTlBRk
JUaXpBSG1ZdU9rcTR3c19aWVwiLFwieVwiOlwiNEhzWi1TRS1wXy0tSkwyMWJUNVRMS2ZZSXB6dnRkVmNYaWZw
a0NBbVdJNFwifSJ9.
eyJpYXQiOjE1ODA5MTAwMjIsInN1YiI6Imh0dHBzOi8vbWFuZ3JvdmUucmV2aWV3cyIsInJhdGluZyI6NzUsIm
9waW5pb24iOiJHcmVhdCB3ZWJzaXRlIGZvciByZXZpZXdzLiIsIm1ldGFkYXRhIjp7Im5pY2tuYW1lIjoiam9o
bjEyMyIsImNsaWVudF9pZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCJ9fQ.
7xQtIlHuDdCVioyztj8i3zJ8dk3oCSfKr6VCR5RtBn6sBcqvpfyvs13PlKGJoamKzx8xUgQTQJjRPv5s91-VLQ
```

### As decoded JSON

Header:
```json
{
  "alg": "ES256",
  "typ": "JWT",
  "kid": "-----BEGIN PUBLIC KEY-----MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEp78fk5yCjbiYavyR6FClqq9AFBTizAHmYuOkq4ws/Zbgexn5IT6n/74kvbVtPlMsp9ginO+11VxeJ+mQICZYjg==-----END PUBLIC KEY-----",
  "jwk": "{\"crv\":\"P-256\",\"ext\":true,\"key_ops\":[\"verify\"],\"kty\":\"EC\",\"x\":\"p78fk5yCjbiYavyR6FClqq9AFBTizAHmYuOkq4ws_ZY\",\"y\":\"4HsZ-SE-p_--JL21bT5TLKfYIpzvtdVcXifpkCAmWI4\"}"
}
```

Payload (JWT Claims Set):

```json
{
  "iat": 1580910261,
  "sub": "https://www.openstreetmap.org",
  "rating": 75,
  "opinion": "Great global map data!",
  "metadata": {
    "nickname": "john123",
    "client_id": "https://mangrove.reviews"
  }
}
```

Try decoding the token yourself using the [Debugger](https://jwt.io/): just paste in the token and use the `kid` from header to verify signature.

## Mangrove Review creation and verification

Mangrove Reviews are meant to be easily constructed and verified using any existing [JWT libraries](https://jwt.io/). [A dedicated JavaScript library](https://js.mangrove.reviews) is also available and libraries in other languages will be developed according to demand.

## Mangrove Review Format (MaReFo)

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://tools.ietf.org/html/rfc2119).

In particular, for a Mangrove Review to be compatible with original servers all "RECOMMENDED" items should be observed.

---

Mangrove Review (Review) MUST be compliant with the [JSON Web Token (JWT) standard](https://tools.ietf.org/html/rfc7519) and encoded as [JSON Web Signature (JWS)](https://www.rfc-editor.org/rfc/rfc7515.html). This format definition specifies name/value pairs which are expected in the JWT header (JOSE Header) as well as in the JWT Claims Set.

The JWT signature type SHOULD be `ES256` (ECDSA on P-256 with SHA-256 digest).

### Mangrove Review Header

Review header MUST be compliant with [JSON Web Signature (JWS) Header format](https://www.rfc-editor.org/rfc/rfc7515.html#section-4) and MUST contain the following parameters:
- `alg`: SHOULD be equal to `"ES256"`
- `typ`: SHOULD be equal to `"JWT"`
- `jwk`
  - Public key of the reviewer or service used by reviewer.
  - MUST be in [JSON Web Key (JWK) format](https://www.rfc-editor.org/rfc/rfc7517.html) encoded as string
  - MUST contain parameter `"key_ops": ["verify"]`
  - SHOULD contain parameters: `"crv": "P-256"`, `"kty" :"EC"`
- `kid`
  - Public key of the reviewer or service used by reviewer.
  - MUST be in PEM format as specified in RFCs [1421](https://tools.ietf.org/html/rfc1421) to [1424](https://tools.ietf.org/html/rfc1424)

Both `jwk` and `kid` parameters MUST be public keys which lead to successful verification of the JWT signature.

### Mangrove Review Claims Set

Review payload MUST include the following claims :
- `iat`
  - Unix time at the moment the review was left (issued at).
  - Specified in the [JWT RFC section 4.1.1](https://tools.ietf.org/html/rfc7519#section-4.1.1).
- `sub`
  - Unique reviewed subject identifier in the form of [URI](https://tools.ietf.org/html/rfc3986).
  - SHOULD comply with one of supported URI schemes (see [Mangrove Core URI Schemes](#mangrove-core-uri-schemes)).

Review MUST include either `rating` or `opinion` claim, which means it MAY omit one of them. These claims, when included, MUST have values as follows:
- `rating`
    - Number indicating how likely the reviewer is to recommend the subject.
    - MUST be an integer in the range from `1` to `100`.
- `opinion`
    - Opinion of the reviewer about the subject. 
    - MUST be a string with length less than or equal to `500`.

Each new Review issued by the reviewer SHOULD differ in at least the `sub`, `rating` or `opinion` claims.

Review MAY include any of the following keys and values:
- `images`
    - Information about attached pictures which are relevant to the review.
    - MUST be an array with each item being an object. Length of the array SHOULD NOT exceed 5 items.
    - Each item MUST include an `src` field with URL of an image stored on a publicly accessible server or decentralized network.
    - Each item MAY include an `label` field with description text for the image with length of at most `50`.
- `metadata` MUST be an object with keys being strings. Each key SHOULD be equal to one of Core Metadata Keys (see [Mangrove Core Metadata Field Standards](#mangrove-core-metadata-field-standards-macomes)). Each value corresponding to a Core Metadata Key MUST comply with the corresponding Core Metadata Field Standard.

## Mangrove Core URI Schemes

Value of the `sub` claim MUST comply with one of Core URI Schemes:
- `https`
    - Refers to a Website that is being reviewed.
    - MUST comply with [URL specification](https://url.spec.whatwg.org/) and is no longer than 100 letters.
- `geo`
    - Refers to a business location or physical point of interest being reviewed - a place.
    - MUST comply with [URI for Geographic Locations specification](https://tools.ietf.org/html/rfc5870), however using URL encoding - including parameters as query string - which is currently more [widely used](https://developers.google.com/maps/documentation/urls/android-intents#location_search).
    - Query string for this URI (content following `?`):
        - MUST contain a field `q=` for which the value is a commonly used name of the selected place with [URI compliant percent encoding](https://tools.ietf.org/html/rfc3986) which SHOULD not be longer than 100 letters.
        - MAY contain a field `u=` for which the value indicates an approximate radius of the place in meters which SHOULD not be greater than 40000000.
    - Reviews should be considered to refer to a given subject if:
      - they contain the same `q=` parameter
      - their coordinates are within a distance which is a sum of the two `u=` values.
- `urn:lei`
    -  Refers to a legal entity being reviewed.
    -  Scheme MUST be followed by a valid LEI according to [ISO 17442](https://www.gleif.org/en/about-lei/iso-17442-the-lei-code-structure) which is equal to one of registered legal entity identifiers in [GLEIF database](https://www.gleif.org/en/).
    -  GLEIF data is open and accessible for [download](https://www.gleif.org/en/lei-data/gleif-golden-copy/download-the-golden-copy#/) or access via [API](https://documenter.getpostman.com/view/7679680/SVYrrxuU?version=latest).
- `urn:isbn`
    - Refers to a book being reviewed.
    - Scheme MUST be followed by a valid ISBN according to [ISO 2108:2017](https://www.iso.org/standard/65483.html) which is equal to one of numbers assigned by [ The International ISBN Agency](https://www.isbn-international.org/).
    - ISBN data can be accessed via [Open Library](https://openlibrary.org/dev/docs/api/books) or [ISBNdb](https://isbndb.com/).
- `urn:maresi`
    - Refers to another Mangrove Review that is to be reviewed, indicating its helpfulness or accuracy.
    - Scheme SHOULD be followed JWT signature of the Review that is to be reviewed (one of Mangrove Reviews in the current database).

## Mangrove Core Metadata Field Standards (MaCoMes)

These fields are meant to represent additional data about the reviewer, circumstances of leaving the review or any other data which may be useful for review Users and analysis algorithms. Mangrove Review MAY include any of the fields.

The key `metadata` contains a map of key/value pairs, where each key SHOULD be equal to one of following keys and have value as described:
- `age` MUST be an unsigned integer which SHOULD be the age of the reviewer of at most 200.
- `experience_context` SHOULD be one of common contexts in which the reviewer primarily had experience with the subject:
  - `business`
  - `family` for experiences involving the whole family, typically with children
  - `couple` for experiences as a romantic couple
  - `friends` for experiences made together with one or more friends 
  - `solo` for experiences made alone 
- `openid` SHOULD be the openID associated with the reviewer of length less than 20.
- `data_source` MUST be a correct URL of the data source if the information does not originate from the reviewer.
- `reviewer_index` MUST be an unsigned integer which SHOULD be a unique index used by the reviewer, usually indicating a ranking in a list. MUST be at most the [JavaScript safe integer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER): 9007199254740991.

Fields based on [OpenID Standard Claims](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims):
- `nickname` MUST be a user specified name to be displayed of length less than 20.
- `preferred_username` MUST be a name of account used for this review of length less than 20. 
- `birthdate` SHOULD be the date of birth of the reviewer.
- `family_name` SHOULD be the last name of the reviewer of length less than 20.
- `given_name` SHOULD be the first name of the reviewer of length less than 20.
- `gender` SHOULD be the gender of the reviewer of length less than 20.
- `client_id` MUST be a correct URI corresponding to the resource the review originates from: website or app.

Flag fields can be added to indicate particular review property, when present their value MUST be equal to `true`:
- `is_generated` SHOULD be present if the review has been left by a review generating bot.
- `is_affiliated` SHOULD be present if the review has been left by a reviewer affiliated with the subject, such as business owner or employee.
- `is_personal_experience` SHOULD be present if the review has been left by a reviewer who had direct experience with the subject of the review and is not based on a third party account.

## Principles of the data format specification

### 1. Usefulness

For the dataset to be useful for as many people and organizations as possible, we believe it needs to ensure a few key requirements, each explained in more detail further below.

- Be [reliable](#reliability): there should be a set of mechanisms to allow aggregation algorithms to generate a reliable single rating, including the possibility to identify reviews that violate the terms of service, while at the same time upholding high transparency standards towards users.  
- Enable decision-making: the review format should ensure that the data is well-structured so that reviews can be  aggregated to a single rating; it should allow for [meaningful content](#meaningful-content) that can be processed by different filtering and recommendation algorithms to generate useful insights for different parties; and the data format should be extensible to fit changing decision-making needs.
- Be unambiguous: each review should contain an [unambiguous](#clear-subject-identification) reference to the Subject that is reviewed.

#### 1.1. Reliability

Reliability is a key element of the usefulness of the dataset, and requires several mechanisms:

- a notion of a persistent identity to establish a track record for a reviewer. This necessitates a special approach in an environment aiming to work without a central authority holding user names and passwords that would allow to identify the users personally. Mangrove uses public key cryptography to allow the persistent association of reviewers with public keys.
- time relevance: each review includes a time stamp to ensure that older reviews can be given less weight and that reviewers can cease to use a selected public key.
- possibility for the community to highlight reviews that are particularly useful, or reviews that violate the terms of service: we introduce a new URN scheme allowing for this highlighting
- proof of purchase or verified purchase: we will add additional fields to the metadata to capture this feature, in cooperation with the first partners to integrate Mangrove into their service.

#### 1.2. Meaningful content

Each review should contain at least some useful input about the Subject, and at the same time be able to include flexibly a set of additional information. 

The minimal input requirement is to provide either a rating or an opinion describing the experience, or both. For the rating: To make determination of review sentiment easier, a rating field is used. This field provides a numerical value for how likely the reviewer is to recommend the subject. The range of values is kept at 100 to ensure usefulness for different rating schemes: percentage rating (1-100), 1-5 stars (1, 25, 50, 75, 100), or thumbs up/down (1, 100).

Flexible additional information: It should be possible to include additional data with the review. This can include references to media files such as pictures or audio, or metadata which may be useful to the readers or processing algorithms to put the experience into context.

#### 1.3. Clear subject identification

Different subjects can by identified by different identifiers, that is why multiple identifier schemes are allowed. Each identifier scheme aims to provide a way to obtain unambiguous id for the subject being reviewed.

### 2. Decentralization

It should be possible to issue reviews and establish identity without a central authority. The core specification allows anyone to create a review by generating a key pair and signing the review with the private key. Subject identifier type specifications also favor any IDs which can be determined without a central authority.

### 3. Privacy

Reviewers should be able to reveal as little information about themselves as they wish. This is why the format does not require inclusion of any personally identifiable data.

The only identifiers being used are the public keys which help to establish reliability of a reviewer. These can be easily generated and used on a one-off basis or in a persistent manner. This means that reviewers can create as many pairs of keys as they wish, although higher reliability is assigned to a reviewer with a longer track-record of high-quality reviews linked to the same public key.

An additional format will be established that will allow to link additional public keys to the same identity (e.g., public keys generated with different devices).

### 4. Standards reuse

Where possible and practical, existing standards should be leveraged. Mangrove leverages:
- [JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519) format for the overall review
- URI for uniquely identifying subjects which are being reviewed and certain metadata
- [URI for Geographic Locations specification / 'geo' URI](https://tools.ietf.org/html/rfc5870) for reviewing of places
- URL for referring websites
- URN for referring to LEI codes and ISBNs
- LEI for referring to legal entitites
- FOAF and [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims) vocabulary for the names of `metadata` fields
- ES256 public key cryptography standard as used by FIDO2 and WebCrypto

For the overall claim framework [Decentralized Identifiers (DIDs)](https://w3c-ccg.github.io/did-spec/) were considered; however, that emerging standard significantly differs in original goals and specifies a number of components not necessary in Mangrove. For message encoding saltpack.org was considered, however [lack of activity around specification](https://github.com/keybase/saltpack/issues) does not inspire confidence. 

## Change or ask

Please suggest changes or engage in discussion on issues in [the Mangrove repo](https://gitlab.com/plantingspace/mangrove).
