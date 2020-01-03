export { imageUrl, downloadLink, displayName }

function imageUrl(hash) {
  return `${process.env.VUE_APP_FILES_URL}/${hash}`
}

function downloadLink(data) {
  return `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data)
  )}`
}

function displayName(meta) {
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

async function deriveKey() {
  const keypair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign']
  )

  const rootPk = await window.crypto.subtle.exportKey('raw', keypair.publicKey)

  // Manually alter the root and derive.
  const childSeed = new Uint8Array(rootPk.byteLength + 1)

  childSeed.set(new Uint8Array(rootPk), 0)

  childSeed.set([1], rootPk.byteLength)

  const childBase = window.crypto.subtle.importKey(
    'raw',
    childSeed,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  )

  const childKeyOne = await window.crypto.subtle.deriveKey(
    { name: 'HKDF' },
    childBase,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['sign']
  )

  // Derive with salt
  const childHKDF = await window.crypto.subtle.importKey(
    'raw',
    rootPk,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  )

  const childKeyTwo = await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array([1]),
      info: new Uint8Array([1])
    },
    childHKDF,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['sign']
  )

  // Both cases fail with "ECDSA: Unsupported operation: get key length"
  return [childKeyOne, childKeyTwo]
}

deriveKey()
