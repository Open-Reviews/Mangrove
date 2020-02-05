# Mangrove Review Standard (MaReSt) v0.1.1

The mission of the Mangrove initiative is to create a public space on the Internet where people can freely share insights with each other and make better decisions based on open data. Mangrove contributes to the Open and Privacy movements by proposing an alternative architecture that is characterized by a **separation of data and products**, and that **respects the right to privacy**:

* The **data**, representing the insights, knowledge and wisdom of the public, is open and freely available to all. As such, it provides a valuable foundation for many use-cases, including research, social or commercial purposes.
* **Products** (i.e., applications and services) built upon crowd-sourced or publicly funded data should make profit based on innovation and technological merit, and not on keeping the data proprietary. An architecture that separates data from products helps remove barriers to entry and avoids information silos.
* The **privacy** of contributors cannot be compromised in Mangrove, as no personally identifiable information and no metadata is collected on the 'data level'. If service providers need to collect user data to enable their services, they may do so in their user interfaces on the 'product level', affecting only those users who trust their particular services. 

We want this open dataset to be as useful as possible, to as many people and organizations as possible. Interoperability of data is an important element to reach this goal. To enable interoperability, we need agreed-upon technical standards. Therefore, the Mangrove initiative proposes the **Mangrove Review Standard** as a way for people to represent insights in the form of reviews. We invite the Open and Privacy communities to contribute to this standard.

The standard was developed based on a set of [principles](#principles-of-the-data-format-specification) that guided the design decisions made.

## Definitions

**Mangrove review** ("Review"): a statement by a reviewer about an subject, whereby the review is provided according to the MaReSt, and contains, among other things, either a rating (a number between 1 and 100) for the subject, or an opinion (a piece of text describing the experience) about the subject, or both.

**Subject**: something that is being reviewed in Mangrove. This can be: a place on a map (e.g., restaurant, hotel, touristic site), a website, or a company.

**Mangrove reviewer** ("Reviewer"): a person or organization who contributes to the Mangrove open dataset by writing a review. A contributor can write a review directly on the Mangrove website, or indirectly through the websites of third-party services or applications that integrate with Mangrove.

**Mangrove user** ("User"): a person or organization that makes use of individual reviews and/or aggregated ratings, by reading them on the Mangrove or a third-party website, or by integrating the Mangrove dataset into a third-party service.

**Aggregation algorithm**: an algorithm that aggregates individual reviews into a single rating for an subject and highlights the most useful ones.

**Mangrove servers**: servers that host data compatible with the Mangrove Review Standard.

**Original Mangrove server**: server maintained by the Mangrove initiative. 

### Changes currently being considered

- using compressed ECDSA public keys
- use CBOR tagging rather than encoding bytes as base64url

## Mangrove Review Example

In JSON format:
```json
{
    "signature":
        "ZnQ-uqIhcyUaEwGpS2wXK5Y4aBq4wZaKlnFP1aEuCHsilA1dbNAvbaNSSwShfkuyPPLQlvuj6pN09tZ-ZC71dg",
    "payload": {
        "iss":
            "BBmEKZciGMonT_G0CmiM4HdfM6o0ktuh3xIFadvc1TVgA0ZJUNIS6go0pX8jwSUorbDfv27T_M9M9wldMFk6t00",
        "iat": 1570562109,
        "sub": "https://google.com",
        "rating": 75,
        "opinion": "Great for finding new sites.",
        "metadata": {
            "nickname":"john123"
        }
    }
}
```

As Canonical CBOR:
```
TODO
```

## Mangrove Creation and Verification

JavaScript and Rust sample implementations are work in progress and will be published soon.

## Mangrove Review Format (MaReFo)

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://tools.ietf.org/html/rfc2119).

In particular, for a Mangrove Review to be compatible with original servers all "RECOMMENDED" items should be observed.

---

Mangrove Review (Review) MUST consist of key/value pairs. Review fields MAY be shared in a number of different ways, with the most common being:
- JSON
- CBOR
- HTTP method query fields

Each Review MUST be representable as [Canonical CBOR](https://tools.ietf.org/html/rfc7049), and in particular Major type 5 (a map of pairs of data items). This means that each key and value MUST be one of the major CBOR types. All review keys MUST be of Major type 3 (a text string).

Review MUST include the following keys and corresponding values:
- `payload`
    - The content of the review along with any metadata.
    - MUST be a Major type 5 (a map of pairs of data items) with keys and values described in [Review payload section](#review-payload).
- `signature`
    - MUST be a Major type 3 (a text string) signature represented in base64url encoding.
    - MUST be a valid ES256 (ECDSA on P-256 with SHA-256 digest) signature of [Canonical CBOR](https://tools.ietf.org/html/rfc7049) encoded review payload, corresponding to its `iss` public key value.

### Review payload

Review payload MUST include the following keys and corresponding values:
- `iss`
    - The public key corresponding to the private key of the reviewer (issuer).
    - MUST be a Major type 3 (a text string) of length `130`.
    - MUST correspond to an ECDSA public key in base64url encoding.
- `iat`
    - Unix time at the moment the review was left (issued at).
    - MUST be of Major type 0 (an unsigned integer) and MUST NOT be greater than current Unix time.
- `sub`
    - Unique reviewed subject identifier in the form of URI.
    - MUST be a Major type 3 (a text string) representing a [valid URI](https://tools.ietf.org/html/rfc3986). SHOULD comply with one of supported URI schemes (see Mangrove Core URI Schemes).

Review MUST include either `rating` or `opinion` key, which means it MAY omit one of them. These keys, when included, MUST have values as follows:
- `rating`
    - Number indicating how likely the reviewer is to recommend the subject.
    - MUST be a Major type 0 (an unsigned integer) in the range from `1` to `100`.
- `opinion`
    - Opinion of the reviewer about the subject. 
    - MUST be a Major type 3 (a text string) with length less than or equal to `500`.

Review MAY include any of the following keys and values:
- `extra_hashes`
    - References to additional data, such as pictures or audio which are relevant to the review.
    - MUST be a Major type 4 (an array of data items) with each item being a Major type 3 (a text string) of length 64.  Length of the array SHOULD NOT exceed 5 items.
    - Each item MUST be a SHA-256 represented as base64url string, of a file stored on a publicly accessible server or decentralized network.
- `metadata` MUST be of Major type 5 (a map of pairs of data items) with keys being Major type 3 (a text string). Each key SHOULD be equal to one of Core Metadata Keys (see Mangrove Core Metadata Field Standards). Each value corresponding to a Core Metadata Key MUST comply with the corresponding Core Metadata Field Standard.

## Mangrove Core URI Schemes

Value corresponding to the `sub` key MUST be of Major type 3 (a text string) and comply with one of Core URI Schemes:
- `http`/`https`: for this scheme, the `sub`:
    - Refers to a Website that is being reviewed.
    - MUST comply with [URL specification](https://url.spec.whatwg.org/) and is no longer than 100 letters.
- `geo`: for this scheme, the `sub`:
    - Refers to a business location or physical point of interest being reviewed - a place.
    - MUST comply with [URI for Geographic Locations specification](https://tools.ietf.org/html/rfc5870), however using URL encoding - including parameters as query string - which is currently more [widely used](https://developers.google.com/maps/documentation/urls/android-intents#location_search).
    - Query string for this URI (content following `?`):
        - MUST contain a field `q=` for which the value is a commonly used name of the selected place with [URI compliant percent encoding](https://tools.ietf.org/html/rfc3986) which SHOULD not be longer than 100 letters.
        - MAY contain a field `u=` for which the value indicates an approximate radius of the place in meters which SHOULD not be greater than 40000000.
- `urn:lei`: for this scheme, the `sub`:
    -  Refers to a legal entity being reviewed.
    -  Scheme MUST be followed by a valid LEI according to [ISO 17442](https://www.gleif.org/en/about-lei/iso-17442-the-lei-code-structure) which is equal to one of registered legal entity identifiers in [GLEIF database](https://www.gleif.org/en/).
    -  GLEIF data is open and accessible for [download](https://www.gleif.org/en/lei-data/gleif-golden-copy/download-the-golden-copy#/) or access via [API](https://documenter.getpostman.com/view/7679680/SVYrrxuU?version=latest).
- `urn:isbn`: for this scheme, the `sub`:
    - Refers to a book being reviewed.
    - Scheme MUST be followed by a valid ISBN according to [ISO 2108:2017](https://www.iso.org/standard/65483.html) which is equal to one of numbers assigned by [ The International ISBN Agency](https://www.isbn-international.org/).
    - ISBN data can be accessed via [Open Library](https://openlibrary.org/dev/docs/api/books) or [ISBNdb](https://isbndb.com/).
- `urn:maresi`: for this scheme, the `sub`:
    - Refers to another Mangrove Review that is to be reviewed, indicating its helpfulness or accuracy.
    - Scheme SHOULD be followed by `signature` field of the Review that is to be reviewed (one of Mangrove Reviews in the current database).

## Mangrove Core Metadata Field Standards (MaCoMes)

These fields are meant to represent additional data about the reviewer, circumstances of leaving the review or any other data which may be useful for review Users and analysis algorithms. Mangrove Review MAY include any of the fields.

The key `metadata` contains a map of key/value pairs, where each key SHOULD be equal to one of following keys and have value as described:
- `age` MUST be of Major type 0 (an unsigned integer) which SHOULD be the age of the reviewer of at most 200.
- `experience_context` SHOULD be one of common contexts in which the reviewer primarily had experience with the subject:
  - `business`
  - `family` for experiences involving the whole family, typically with children
  - `couple` for experiences as a romantic couple
  - `friends` for experiences made together with one or more friends 
  - `solo` for experiences made alone 
- `openid` SHOULD be the openID associated with the reviewer of length less than 20.
- `data_source` MUST be a correct URL of the data source if the information does not originate from the reviewer.
- `issuer_index` MUST be of Major type 0 (an unsigned integer) which SHOULD be a unique index used by the reviewer, usually indicating a ranking in a list. MUST be at most the [JavaScript safe integer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER): 9007199254740991.

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


Additional fields to be added, including items such as proof-of-purchase, identity token, useful information about the subject, circumstances of the experience.

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
- Canonical CBOR for encoding payload before signing for transmission
- [JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519) format for the overall review (CBOR based encoding is used as in CWT to be more in line with FIDO2 developments)
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
