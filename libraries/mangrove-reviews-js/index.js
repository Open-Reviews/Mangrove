/** @module All functions */
const axios = require('axios')
const jwkToPem = require('jwk-to-pem')
const jsonwebtoken = require('jsonwebtoken')

/** The API of the server used for https://mangrove.reviews */
const ORIGINAL_API = 'https://api.mangrove.reviews'

/**
 * Check and fill in the review payload so that its ready for signing.
 * See the [Mangrove Review Standard](https://mangrove.reviews/standard) for more details.
 * @param {Object} payload - Base payload to be cleaned, it will be mutated.
 * @param {string} payload.sub - URI of the review subject.
 * @param {number} [payload.rating] - Rating of subject between 0 and 100.
 * @param {string} [payload.opinion] - Opinion of subject with at most 500 characters.
 * @returns Payload ready to sign.
 */
function cleanPayload(payload) {
  if (!payload.sub) throw 'Payload must include subject URI in `sub` field.'
  if (!payload.rating && !payload.opinion) throw 'Payload must include either rating or opinion.'
  if (payload.rating < 0 || payload.rating > 100) throw 'Rating must be in the range from 0 to 100.'
  payload.iat = Math.floor(Date.now() / 1000)
  if (payload.rating === null) delete payload.rating
  if (!payload.opinion) delete payload.opinion
  if (!payload.images || !payload.images.length) delete payload.images
  const meta = { client_id: window.location.href, ...payload.metadata }
  Object.entries(meta).forEach(([k, v]) => v === null && delete meta[k])
  payload.metadata = meta
  return payload
}

/** Assembles JWT from base payload, mutates the payload as needed.
 * @param keypair - WebCrypto keypair, can be generated with `generateKeypair`.
 * @param {Object} payload - Base payload to be cleaned, it will be mutated.
 * @param {string} payload.sub - URI of the review subject.
 * @param {number} [payload.rating] - Rating of subject between 0 and 100.
 * @param {string} [payload.opinion] - Opinion of subject with at most 500 characters.
 */
async function signReview(keypair, payload) {
  return jsonwebtoken.sign(
    cleanPayload(payload),
    await privateToPem(keypair.privateKey),
    {
      algorithm: 'ES256',
      header: {
        jwk: JSON.stringify(
          await crypto.subtle.exportKey('jwk', keypair.publicKey)
        ),
        kid: await publicToPem(keypair.publicKey)
      }
    }
  )
}

/**
 * Submit a signed review to be stored in the database.
 * @param {string} jwt 
 * @param {string} api 
 * @returns {Promise} Resolves to "true" in case of successful insertion or rejects with errors.
 */
function submitReview(jwt, api = ORIGINAL_API) {
  return axios.put(`${api}/submit/${jwt}`)
}

/**
 * Composition of `signReview` and `submitReview`.
 * @param keypair - WebCrypto keypair, can be generated with `generateKeypair`.
 * @param {Object} payload - Base payload to be cleaned, it will be mutated.
 * @param {string} payload.sub - URI of the review subject.
 * @param {number} [payload.rating] - Rating of subject between 0 and 100.
 * @param {string} [payload.opinion] - Opinion of subject with at most 500 characters.
 * @param {string} [api=ORIGINAL_API] - API endpoint used to fetch the data.
 */
async function signAndSubmitReview(keypair, payload, api = ORIGINAL_API) {
  const jwt = await signReview(keypair, payload)
  return submitReview(jwt, api)
}

/**
 * Retrieve reviews which fulfill the query.
 * @param {Object} query - See the API documentation for query, working on an automated generator here.
 * @param {string} [api=ORIGINAL_API] - API endpoint used to fetch the data.
 */
function getReviews(query, api = ORIGINAL_API) {
  return axios.get(`${api}/reviews`, {
    params: query,
    headers: { 'Content-Type': 'application/json'}
  }).then(({ data }) => data)
}

/**
 * Get aggregate information about the review subject.
 * @param {string} uri - URI of the review subject.
 * @param {string} [api=ORIGINAL_API] - API endpoint used to fetch the data.
 */
function getSubject(uri, api = ORIGINAL_API) {
  return axios.get(`${api}/subject/${encodeURIComponent(uri)}`).then(({ data }) => data)
}

/**
 * Get aggregate information about the reviewer.
 * @param {string} pem - Reviewer public key in PEM format.
 * @param {string} [api=ORIGINAL_API] - API endpoint used to fetch the data.
 */
function getIssuer(pem, api = ORIGINAL_API) {
  return axios.get(`${api}/issuer/${encodeURIComponent(pem)}`).then(({ data }) => data)
}

function batchAggregate(query, api = ORIGINAL_API) {
  if (!query.pems && !query.subs) { return null }
  return axios.post(`${api}/batch`, query).then(({ data }) => data)
}

/**
 * Generate a new user identity, which can be used for signing reviews and stored for later.
 * @returns ECDSA
 * [WebCrypto](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
 * key pair with `privateKey` and `publicKey`
 */
function generateKeypair() {
  return crypto.subtle
    .generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    )
}

const PRIVATE_KEY_METADATA = 'Mangrove private key'

/**
 * Come back from JWK representation to representation which allows for signing.
 * Import keys which were exported with `keypairToJwk`.
 * @param jwk - Private JSON Web Key (JWK) to be converted in to a WebCrypto keypair.
 */
async function jwkToKeypair(jwk) {
  // Do not mutate the argument.
  let key = { ...jwk }
  if (!key || key.metadata !== PRIVATE_KEY_METADATA) {
    throw new Error(
      `does not contain the required metadata field "${PRIVATE_KEY_METADATA}"`
    )
  }
  const sk = await crypto.subtle.importKey(
    'jwk',
    key,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign']
  )
  delete key.d
  delete key.dp
  delete key.dq
  delete key.q
  delete key.qi
  key.key_ops = ['verify']
  const pk = await crypto.subtle.importKey(
    'jwk',
    key,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['verify']
  )
  return { privateKey: sk, publicKey: pk }
}

/**
 * Exports a keypair to JSON Web Key (JWK) of the private key.
 * JWK is a format which can be then used to stringify and store.
 * You can later import it back with `jwkToKeypair`.
 * @param keypair - WebCrypto key pair, can be generate with `generateKeypair`.
 */
async function keypairToJwk(keypair) {
  const s = await crypto.subtle.exportKey('jwk', keypair.privateKey)
  s.metadata = PRIVATE_KEY_METADATA
  return s
}

function u8aToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

/**
 * Get PEM represenation of the user "password".
 * @param key - Private WebCrypto key to be exported.
 */
async function privateToPem(key) {
  try {
    const exported = await crypto.subtle.exportKey('pkcs8', key)
    const exportedAsString = u8aToString(exported)
    const exportedAsBase64 = window.btoa(exportedAsString)
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`
  } catch {
    // Workaround for Firefox webcrypto not working.
    const exported = await crypto.subtle.exportKey('jwk', key)
    return jwkToPem(exported, { private: true })
  }
}

/**
 * Get PEM representation of public reviewer identity.
 * This format can be found in the `kid` field of a Mangrove Review Header.
 * @param key - Public WebCrypto key to be exported.
 */
async function publicToPem(key) {
  const exported = await crypto.subtle.exportKey('spki', key)
  const exportedAsString = u8aToString(exported)
  const exportedAsBase64 = window.btoa(exportedAsString)
  // Do not add new lines so that its copyable from plain string representation.
  return `-----BEGIN PUBLIC KEY-----${exportedAsBase64}-----END PUBLIC KEY-----`
}

module.exports = {
  ORIGINAL_API,
  cleanPayload,
  signReview,
  submitReview,
  signAndSubmitReview,
  getReviews,
  getSubject,
  getIssuer,
  batchAggregate,
  generateKeypair,
  keypairToJwk,
  jwkToKeypair,
  privateToPem,
  publicToPem
}

