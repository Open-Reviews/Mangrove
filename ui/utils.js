export const MAX_OPINION_LENGTH = 500

export function imageUrl(hash) {
  return `${process.env.VUE_APP_FILES_URL}/${hash}`
}

export function downloadLink(data) {
  return `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data)
  )}`
}

export function pkDisplay(pk) {
  return pk.slice(0, 10) + '...' + pk.slice(-10)
}

export function displayName(meta) {
  if (!meta) {
    return 'Anonymous'
  }
  if (meta.given_name || meta.family_name) {
    const realName = [meta.given_name, meta.family_name]
      .filter((n) => n)
      .join(' ')
    if (meta.display_name) {
      return `${meta.display_name} (${realName})`
    } else {
      return realName
    }
  } else if (meta.display_name) {
    return meta.display_name
  } else {
    return 'Anonymous'
  }
}

export function isMobile() {
  return navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i)
}

const PRIVATE_KEY_METADATA = 'Mangrove private key'

export async function jwkToKeypair(jwk) {
  if (!jwk || jwk.metadata !== PRIVATE_KEY_METADATA) {
    throw new Error(
      `does not contain the required metadata field "${PRIVATE_KEY_METADATA}"`
    )
  }
  const sk = await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign']
  )
  delete jwk.d
  delete jwk.dp
  delete jwk.dq
  delete jwk.q
  delete jwk.qi
  jwk.key_ops = ['verify']
  const pk = await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['verify']
  )
  return { privateKey: sk, publicKey: pk }
}

export function skToJwk(keypair) {
  return crypto.subtle.exportKey('jwk', keypair).then((s) => {
    s.metadata = PRIVATE_KEY_METADATA
    return s
  })
}

function u8aToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

export async function keyToPem(key) {
  const exported = await window.crypto.subtle.exportKey('pkcs8', key)
  const exportedAsString = u8aToString(exported)
  const exportedAsBase64 = window.btoa(exportedAsString)
  return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`
}
