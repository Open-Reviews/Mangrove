# Mangrove Client JS Library

Retrieve and submit Mangrove reviews. Key pair related functions work only in the browser using WebCrypto.

[![npm](https://img.shields.io/npm/v/mangrove-reviews)](https://www.npmjs.com/package/mangrove-reviews)

[Interface documentation](https://js.mangrove.reviews/global.html)

Retrieve reviews according to different criteria.

```javascript
import { getReviews } from 'mangrove-reviews'

// Of a particular subject.
const subReviews = await getReviews({ sub: 'https://nytimes.com' })

// Given by a particular user since certain time.
const userReviews = await getReviews({
  kid: '-----BEGIN PUBLIC KEY-----MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEDo6mN4kY6YFhpvF0u3hfVWD1RnDElPweX3U3KiUAx0dVeFLPAmeKdQY3J5agY3VspnHo1p/wH9hbZ63qPbCr6g==-----END PUBLIC KEY-----',
  gt_iat: 1580860800
})
```

User accounts:
- generate user accounts / key pairs
- serialize and deserialize key pair
- sign reviews with key pair
- submit reviews

**For test submissions which should be deleted later please use `https://example.com` or `geo:0,0?q=<any_name>&u=30` in the `sub` field.**

```javascript
import {
  generateKeypair,
  keypairToJwk,
  jwkToKeypair,
  signAndSubmitReview
} from 'mangrove-reviews'

const keypair = await generateKeypair()

// Show the private key.
const jwk = await keypairToJwk(keypair)
console.log(jwk)

// Restore key pair from JWK.
const restoredKeypair = await jwkToKeypair(jwk)

// Sign and submit a review (reviews of this example subject are removed from the database).
signAndSubmitReview(keypair, {
  sub: "https://example.com",
  rating: 75,
  opinion: "Great website to be used as an example.",
  metadata: {
    nickname: "docs reader"
  }
})
```
