The mission of the Mangrove initiative is to create a public space on the Internet where people can freely share insights with each other and make better decisions based on open data. Mangrove contributes to the Open and Privacy movements by proposing an alternative architecture that is characterized by a **separation of data and products**, and that **respects the right to privacy**:

* The **data**, representing the insights, knowledge and wisdom of the public, is open and freely available to all. As such, it provides a valuable foundation for many usecases, including research, social or commercial purposes.
* **Products** (i.e., applications and services) built upon crowd-sourced or publicly funded data should make profit based on innovation and technological merit, and not on keeping the data proprietary. An architecture that separates data from products helps remove barriers to entry and avoids information silos.
* The **privacy** of contributors cannot be compromised in Mangrove, as no personally identifyable information and no metadata is collected on the 'data level'. If service providers need to collect user data to enable their services, they may do so in their user interfaces on the 'product level', affecting only those users who trust their particular services. 

We want this open dataset to be as useful as possible, to as many people and organisations as possible. Interoperability of data is an important element to reach this goal. To enable interoperability, we need agreed-upon technical standards. Therefore, the Mangrove initiative proposes the **Mangrove Review Standard** as a way for people to represent insights in the form of reviews. We invite the Open and Privacy communities to contribute to this standard.

The standard was developed based on a set of [principles](#principles-of-the-data-format-specification) that guided the design decisions made.

# Mangrove Review Standard (MaReSt) v1

### Definitions

**Mangrove review** ("Review"): a statement by a reviewer about an object, whereby the review is provided according to the MaReSt, and contains, among other things, either a rating (a number between 1 and 100) for the object, or an opinion (a piece of text describing the experience) about the object, or both.

**Object**: something that is being reviewed in Mangrove. This can be: a place on a map (e.g., restaurant, hotel, touristic site), a website, or a company.

**Mangrove reviewer** ("Reviewer"): a person or organisation who contributes to the Mangrove open dataset by writing a review. A contributor can write a review directly on the Mangrove website, or indirectly through the websites of third-party services or applications that integrate with Mangrove.

**Mangrove user** ("User"): a person or organisation that makes use of individual reviews and/or aggregated ratings, by reading them on the Mangrove or a third-party website, or by integrating the Mangrove dataset into a third-party service.

**Aggregation algorithm**: an algorithm that aggregates individual reviews into a single rating for an object and highlights the most useful ones.

**Mangrove servers**: servers that host data compatible with the Mangrove Review Standard.

**Original Mangrove server**: server maintained by the Mangrove initiative. 

### Changes currently being considered

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

JavaScript and Rust sample implementations are work in progress and will be published soon.

## Mangrove Review Format (MaReFo)

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://tools.ietf.org/html/rfc2119).

In particular, for a Mangrove Review to be compatible with original servers all "RECOMMENDED" items should be observed.

---

Mangrove Review (Review) MUST consist of key/value pairs. Review fields MAY be shared in a number of different ways, with the most common being:
- JSON
- CBOR
- HTTP method query fields

Each Review MUST be representable as [Canonical CBOR](https://tools.ietf.org/html/rfc7049), and in particular Major type 5 (a map of pairs of data items). This means that each key and value MUST be one of the major CBOR types. Review keys MUST be of Major type 3 (a text string).

Review MUST include the following keys and corresponding values:
- `version`
    - This Mangrove Review Format version.
    - MUST be a Major type 0 (an unsigned integer) equal to `1`.
- `publicKey`
    - The public key corresponding to the private key of the reviewer.
    - MUST be a Major type 3 (a text string) of length `130`.
    - MUST correspond to an ECDSA public key in hexadecimal notation.
- `timestamp`
    - Unix time at the moment the review was left.
    - MUST be of Major type 0 (an unsigned integer) and MUST NOT be greater than current Unix time.
- `uri`
    - Unique reviewed object identifier in the form of URI.
    - MUST be a Major type 3 (a text string) representing a [valid URI](https://tools.ietf.org/html/rfc3986). SHOULD comply with one of supported URI schemes (see Mangrove core URI schemes).

Review MUST include either `rating` or `opinion` key, which means it MAY omit one of them. These keys, when included, MUST have values as follows:
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

Unsigned Mangrove Review is a Canonical CBOR encoded map with all key/value pairs besides the `signature` field, which is described next.

Review MUST include a `signature` key with value that:
- MUST be a valid ES256 (ECDSA on P-256 with SHA-256 digest) signature of Unsigned Mangrove Review, corresponding to its `publicKey` value.
- MUST be Major type 3 (a text string) of signature represented in hexadecimal notation.

## Mangrove Core URI Schemes

Value corresponding to the `uri` key MUST be of Major type 3 (a text string) and comply with one of Core URI Schemes:
- `http`/`https`: for this scheme, the `uri`:
    - Refers to a Website that is to be reviewed.
    - MUST comply with [URL specification](https://url.spec.whatwg.org/) and is no longer than 100 letters.
- `geo`: for this scheme, the `uri`:
    - Refers to a business location or physical point of interest being reviewed.
    - MUST comply with [URI for Geographic Locations specification](https://tools.ietf.org/html/rfc5870) with addition of a URI fragment.
    - Fragment for this URI (content following `#`) MUST be a commonly used name of the selected place.
- `urn:LEI`: for this scheme, the `uri`:
    -  Has to be equal to one of registered legal entity identifiers in [GLEIF database](https://www.gleif.org/en/).
    -  Scheme MUST be followed by a valid LEI according to [ISO 17442](https://www.gleif.org/en/about-lei/iso-17442-the-lei-code-structure).
    -  GLEIF data is open and accessible for [download](https://www.gleif.org/en/lei-data/gleif-golden-copy/download-the-golden-copy#/) or access via [API](https://documenter.getpostman.com/view/7679680/SVYrrxuU?version=latest).
- `urn:MaReSi`: for this scheme, the `uri`:
    - Refers to another Mangrove Review that is to be reviewed, indicating its helpfulness or accuracy.
    - Scheme SHOULD be followed by `signature` field of the Review that is to be reviewed (one of Mangrove Reviews in the current database).

## Mangrove Core Metadata Field Standards (MaCoMes)

These fields are meant to represent additional data about the reviewer, circumstances of leaving the review or any other data which may be useful for review Users and analysis algorithms. Mangrove Review MAY include any of the fields.

The key `metadata` contains a map of key/value pairs, where each key SHOULD be equal to one of following keys and have value as described:
- `originURI` MUST be a correct URI corresponding to the resource the review originates from: website or app.
- `accountName` MUST be a name of account used for this review of length less than 20.
- `displayName` MUST be a user specified name to be displayed of length less than 20.
- `age` MUST be of Major type 0 (an unsigned integer) which SHOULD be the age of the reviewer of at most 200.
- `birthday` SHOULD be the date of birth of the reviewer.
- `lastName` SHOULD be the last name of the reviewer of length less than 20.
- `firstName` SHOULD be the first name of the reviewer of length less than 20.
- `gender` SHOULD be the gender of the reviewer of length less than 20.
- `openid` SHOULD be the openid associated with the reviewer of length less than 20.

Additional fields to be added, including items such as proof-of-purchase, identity token, useful information about the object, circumstances of the experience.

## Principles of the data format specification

### Usefulness

For the dataset to be useful for as many people and organisations as possible, we believe it needs to ensure 3 key requirements, each explained in more detail further below.

- Be reliable: there should be a set of mechanisms to allow aggregation algorithms to generate a reliable single rating, including the possibility to disregard reviews that violate the terms of service, while at the same time upholding high transparency standards towards users.  
- Enable decision-making: the review format should ensure that the data is well-structured so that reviews can be  aggregated to a single rating; it should allow for meaningful metadata that can be processed by different filtering and recommendation algorithms to generate useful insights for different parties; and the data format should be upgradeable to fit changing decision-making needs.
- Be unambiguous: each review should contain an unambiguous reference to the Object that is reviewed.

### Decentralisation

It should be possible to issue reviews and establish identity without a central authority. The core specification allows anyone to create a review by generating a key pair and signing the review with the private key. Object identifier type specifications also favor any IDs which can be determined without a central authority.

### Privacy

Reviewers should be able to reveal as little information about themselves as they wish. This is why the format does not require inclusion of any personally identifiable data.

The only identifiers being used are the public keys which help to establish reliability of a reviewer. These can be easily generated and used on a one-off basis or in a persistent manner. This means that reviewers can create as many pairs of keys as they wish, although higher reliability is assigned to a reviewer with a longer track-record of high-quality reviews linked to the same public key.

An additional format will be established that will allow to link additional public keys to the same identity (e.g., public keys generated with different devices).

### Reliability

Reliability is a key element of the usefulness of the dataset, and requires several mechanisms:

- a notion of a persistent identity to establish a track record for a reviewer. This necessitates a special approach in an environment aiming to work without a central authority holding user names and passswords that would allow to identify the users personally. Mangrove uses public key cryptography to allow the persistent association of reviewers with public keys.
- time relevance: each review includes a time stamp to ensure that older reviews can be given less weight and that reviewers can cease to use a selected public key.
- possibility for the community to highlight reviews that are particularly useful, or reviews that violate the terms of service: we introduce a new URN scheme allowing for this highlighting
- 



### Meaningful content

Each review should contain at least some useful input about the object, that is why leaving either rating or opinion is mandatory for each review.

To make determination of review sentiment easier, a rating field is used. This field provides a numerical value for how likely the reviewer is to recommend the object. The range of values is kept at 100 to ensure a range of rating schemes: percentage rating (1-100), 1-5 stars (1, 25, 50, 75, 100), or thumbs up/down (1, 100).

### Flexible additional information

It should be possible for the reviewer or for the service they use to submit a review to leave additional data with the review. This can include references to pictures, audio or metadata which may be useful to the readers or processing algorithms.

### Upgradeability

It should be possible to upgrade the formats, thus each Review includes a version number.

### Clear object identification

Different objects can by identified by different identifiers, that is why multiple identifier types are allowed. Each identifier type aims to provide a way to obtain unambiguous id for the object being reviewed.

### Standards reuse

Where possible and practical, existing standards should be leveraged. Mangrove leverages CBOR, URI, 'geo' URI, URL, URN, LEI, FOAF vocabulary and public key cryptography standard based on FIDO2 and WebCrypto.
For the overall claim framework [Decentralized Identifiers (DIDs)](https://w3c-ccg.github.io/did-spec/) were considered; however, that emerging standard significantly differs in original goals and specifies a number of components not necessary in Mangrove.
For message encoding saltpack.org was considered, however [lack of activity around specification](https://github.com/keybase/saltpack/issues) does not inspire confidence. 


## Change or ask

Please suggest changes or engage in discussion on issues in [the Mangrove repo](https://gitlab.com/plantingspace/mangrove).
