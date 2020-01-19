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

  const childBase = await window.crypto.subtle.importKey(
    'raw',
    childSeed,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  )

  const childKeyOne = await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(),
      info: new Uint8Array()
    },
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
  console.log(childKeyOne)
  console.log(childKeyTwo)
}

deriveKey()
