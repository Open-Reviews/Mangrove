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

// Copies a string to the clipboard. Must be called from within an
// event handler such as click. May return false if it failed, but
// this is not always possible. Browser support for Chrome 43+,
// Firefox 42+, Safari 10+, Edge and Internet Explorer 10+.
// Internet Explorer: The clipboard feature may be disabled by
// an administrator. By default a prompt is shown the first
// time the clipboard is used (per session).
export function copyToClipboard(text) {
  if (window.clipboardData && window.clipboardData.setData) {
    // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
    return window.clipboardData.setData('Text', text)
  } else if (
    document.queryCommandSupported &&
    document.queryCommandSupported('copy')
  ) {
    const textarea = document.createElement('textarea')
    textarea.textContent = text
    textarea.style.position = 'fixed' // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea)
    textarea.select()
    try {
      return document.execCommand('copy') // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn('Copy to clipboard failed.', ex)
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

const SECRET_KEY_METADATA = 'Mangrove secret key'

export async function jwkToKeypair(jwk) {
  if (!jwk || jwk.metadata !== SECRET_KEY_METADATA) {
    throw new Error(
      `does not contain the required metadata field "${SECRET_KEY_METADATA}"`
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
    s.metadata = SECRET_KEY_METADATA
    return s
  })
}
