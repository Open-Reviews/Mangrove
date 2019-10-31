# Mangrove Review Standard (MaReSt) v1

Mangrove review is a statement by a reviewer about an object. Each review is signed by the private key of the reviewer. This review can be then read by readers or processed by algorithms before being read.

The standard can be used with original Mangrove servers as well as separate databases.

### Changes being considered

- using compressed ECDSA public keys
- using DateTime as described in ISO 8601 instead of Unix time
- using [JWT](https://jwt.io/) format for signed reviews

## Mangrove Review Example

```json
{
    "version": 1,
    "publicKey": "04fd42cf1c5058cd50c1e4339dd5d7c0010984167194584a1e728ad2517825cc21cf01d74c7d0f4778192fd274c79ce9cc09d9fbe2586b79db29268a22bc7b707e",
    "timestamp": 1570562109,
    "uri": "https://google.com",
    "rating": 75,
    "opinion": "Great for finding new sites.",
    "metadata": {
        "displayName":"john123"
    }
}
```

## Mangrove Creation and Verification

JavaScript and Rust sample implementations are work in progress and coming soon.

## Mangrove Review Format (MaReFo)

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://tools.ietf.org/html/rfc2119).

In particular for a Mangrove Review to be compatible with original servers all "RECOMMENDED" items should be observed.

---

Mangrove Review (Review) MUST consist of key/value pairs. Review fields MAY be shared in a number of different ways with the most common being:
- JSON
- CBOR
- HTTP method query fields

Each Review MUST be representable as [Canonical CBOR](https://tools.ietf.org/html/rfc7049), and in particular Major type 5 (a map of pairs of data items). This means that each key and value MUST one of major CBOR types. Review keys MUST be of Major type 3 (a text string).

Review MUST include the following keys and corresponding values:
- `version`
    - This Mangrove Review Format version.
    - MUST be a Major type 0 (an unsigned integer) equal to `1`.
- `publicKey`
    - Public key corresponding to the secret key of the reviewer.
    - MUST be a Major type 3 (a text string) of length `130`.
    - MUST correspond to an ECDSA public key in hexadecimal notation.
- `timestamp`
    - Unix time at the moment the review was left.
    - MUST be of Major type 0 (an unsigned integer) and MUST NOT be greater than current Unix time.
- `uri`
    - Unique reviewed object identifier in the form of URI.
    - MUST be a Major type 3 (a text string) representing a [valid URI](https://tools.ietf.org/html/rfc3986). SHOULD comply with one of supported URI schemes (see Mangrove core URI schemes).

Review MUST include either `rating` or `opinion` key, which means it MAY omit one of them. These keys when included MUST have values as follows:
- `rating`
    - Number indicating how likely the reviewer is to recommend the object.
    - MUST be a Major type 0 (an unsigned integer) in the range from `1` to `100`.
- `opinion`
    - Opinion of the reviewer about the object. 
    - MUST be a Major type 3 (a text string) with length less than or equal to `500`.

Review MAY include any of the following keys and values:
- `extraHashes`
    - References to additional data, such as pictures or audio which are relevant to the review.
    - MUST be a Major type 4 (an array of data items) with each item being a Major type 3 (a text string) of length 64.  Length of the array SHOULD NOT exceed 5 items.
    - Each item MUST be a SHA256 represented as hexadecimal string, of a file stored on a publicly accessible server or decentralized network.
- `metadata` MUST be of Major type 5 (a map of pairs of data items) with keys being Major type 3 (a text string). Each key SHOULD be equal to one of Core Metadata Keys (see Mangrove Core Metadata Field Standards). Each value corresponding to a Core Metadata Key MUST comply with the corresponding Core Metadata Field Standard.

Unsigned Mangrove Review is a Canonical CBOR encoded map with all key/value pairs besides the `signature` field described next.

Review MUST include a `signature` key with value that:
- MUST be a valid ES256 (ECDSA on P-256 with SHA-256 digest) signature of Unsigned Mangrove Review, corresponding to its `publicKey` value.
- MUST be Major type 3 (a text string) of signature represented in hexadecimal notation.

## Mangrove Core URI Schemes

Value corresponding to the `uri` key MUST be of Major type 3 (a text string) and comply with one of Core URI Schemes:
- `http`/`https` for this scheme the `uri`:
    - Refers to a Website that is to be reviewed.
    - MUST comply with [URL specification](https://url.spec.whatwg.org/) and is no longer than 100 letters.
- `geo` for this scheme the `uri`:
    - Refers to a business location or physical point of interest being reviewed.
    - MUST comply with [URI for Geographic Locations specification](https://tools.ietf.org/html/rfc5870) with addition of a URI fragment.
    - Fragment for this URI (content following `#`) MUST be a commonly used name of the selected place.
- `urn:LEI` for this scheme the `uri`:
    -  Has to be equal to one of registered legal entity identifiers in [GLEIF database](https://www.gleif.org/en/).
    -  Scheme MUST be followed by a valid LEI according to [ISO 17442](https://www.gleif.org/en/about-lei/iso-17442-the-lei-code-structure).
    -  GLEIF data is open and accessible for [download](https://www.gleif.org/en/lei-data/gleif-golden-copy/download-the-golden-copy#/) or access via [API](https://documenter.getpostman.com/view/7679680/SVYrrxuU?version=latest).
- `urn:MaReSi` for this scheme the `uri`:
    - Refers to another Mangrove Review that is to be reviewed, indicating its helpfulness or accuracy.
    - Scheme SHOULD be followed by `signature` field of one of Mangrove Reviews in the current database.

## Mangrove Core Metadata Field Standards (MaCoMes) - to be finalized

These fields are meant to represent additional data about the reviewer, circumstances of leaving the review or any other data which may be useful for review readers and analysis algorithms.

The key `metadata` contains a map of key/value pairs, where each key SHOULD be equal to one following keys and have value as described:
- `originURI` MUST be a correct URI corresponding to the resource the review originates from: website or app.
- `accountName` MUST be a name of account used for this review of length less than 20.
- `displayName` MUST be a user specified name to be displayed of length less than 20.
- `age` MUST be of Major type 0 (an unsigned integer) which SHOULD be the age of the reviewer of at most 200.
- `birthday` SHOULD be the date of birth of the reviewer.
- `lastName` SHOULD be the last name of the reviewer of length less than 20.
- `firstName` SHOULD be the first name of the reviewer of length less than 20.
- `gender` SHOULD be the gender of the reviewer of length less than 20.
- `openid` SHOULD be the openid associated with the reviewer of length less than 20.

## Principles of the data format specification

### Upgradeability

It should be possible to upgrade the formats, thus each review includes a version number.

### Decentralisation

It should be possible to issue reviews and establish identity without a central authority. The core specification allows anyone to create a review by generating a secret key. Object identifier type specifications also favor any IDs which can be determined without a central authority.

### Privacy

Reviewers should be able to reveal as little information about themselves as they like. This is why the format does not require inclusion of any personally identifiable data.

### Standards reuse

Where possible and practical, existing standards should be leveraged. Mangrove leverages CBOR, URI, 'geo' URI, URL, URN, LEI, FOAF vocabulary and public key cryptography standard based on FIDO2 and WebCrypto.
For the overall claim framework [Decentralized Identifiers (DIDs)](https://w3c-ccg.github.io/did-spec/) were considered; however, that emerging standard significantly differs in original goals and specifies a number of components not necessary in Mangrove.
For message encoding saltpack.org was considered, however [lack of activity around specification](https://github.com/keybase/saltpack/issues) does not inspire confidence. 

### Usefulness

Reviews should be as useful to readers as possible. They should also contain enough data to be meaningfully processed by filtering and recommendation algorithms.

#### Track record

To establish reliability of reviews it is useful to maintain a track record of a reviewer. To be able to do that and to preserve privacy, reviews contain a public key which can be used multiple times by the same reviewer.

A separate format could be also used to link additional public keys to the same identity.

#### Time relevance

Each review includes a time stamp to ensure that older reviews can be given less weight and that reviewers can cease to use a selected public key.

#### Clear object identification

Different objects can by identified by different identifiers, that is why multiple identifier types are allowed. Each identifier type aims to provide a way to obtain unambiguous id for the object being reviewed.

#### Meaningful content

Each review should contain at least some useful input about the object, that is why leaving either rating or opinion is mandatory for each review.

To make determination of review sentiment easier, a rating field is used. This field provides a numerical value for how likely the reviewer is to recommend the object. The range of values is kept at 100 to ensure a range of rating schemes: percentage rating (1-100), 1-5 stars (1, 25, 50, 75, 100), or thumbs up/down (1, 100).

#### Flexible additional information

It should be possible for the reviewer or for the service they use to submit a review to leave additional data with the review. This can include references to pictures, audio or metadata which may be useful to the readers or processing algorithms.

## Change or ask

Please suggest changes or engage in discussion on issues in [the Mangrove repo](https://gitlab.com/plantingspace/mangrove).