const axios = require('axios')
const jwkToPem = require('jwk-to-pem')
const jsonwebtoken = require('jsonwebtoken')

const ORIGINAL_API = 'https://api.mangrove.reviews'

// Base payload requires at least `sub` and `rating` or `opinion` claims.
// Mutates the argument filling and removing fields.
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

// Assembles JWT from base payload, mutates the payload as needed.
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

function submitReview(jwt, api = ORIGINAL_API) {
  return axios.put(`${api}/submit/${jwt}`)
}

async function signAndSubmitReview(keypair, payload, api = ORIGINAL_API) {
  const jwt = await signReview(keypair, payload)
  return submitReview(jwt, api)
}

function getReviews(query, api = ORIGINAL_API) {
  return axios.get(`${api}/reviews`, {
    params: query,
    headers: { 'Content-Type': 'application/json'}
  }).then(({ data }) => data)
}

function getSubject(uri, api = ORIGINAL_API) {
  return axios.get(`${api}/subject/${encodeURIComponent(uri)}`).then(({ data }) => data)
}

function getIssuer(pem, api = ORIGINAL_API) {
  return axios.get(`${api}/issuer/${encodeURIComponent(pem)}`).then(({ data }) => data)
}

function batchAggregate(query, api = ORIGINAL_API) {
  if (!query.pems && !query.subs) { return null }
  return axios.post(`${api}/batch`, query).then(({ data }) => data)
}

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

async function keypairToJwk(keypair) {
  const s = await crypto.subtle.exportKey('jwk', keypair.privateKey)
  s.metadata = PRIVATE_KEY_METADATA
  return s
}

function u8aToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

async function privateToPem(key) {
  try {
    const exported = await window.crypto.subtle.exportKey('pkcs8', key)
    const exportedAsString = u8aToString(exported)
    const exportedAsBase64 = window.btoa(exportedAsString)
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`
  } catch {
    // Workaround for Firefox webcrypto not working.
    const exported = await crypto.subtle.exportKey('jwk', key)
    return jwkToPem(exported, { private: true })
  }
}

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

