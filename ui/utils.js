export const MAX_OPINION_LENGTH = 1000

export function imageUrl(hash) {
  return `${process.env.VUE_APP_FILES_URL}/${hash}`
}

export function downloadLink(data) {
  return `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(data)
  )}`
}

export function pemDisplay(pk) {
  const matches = pk.match(
    /-----BEGIN PUBLIC KEY-----(.{10}).*(.{10})-----END PUBLIC KEY-----/
  )
  return matches[1] + '...' + matches[2]
}

export function displayName(meta, placeholder = 'Anonymous') {
  if (!meta) {
    return placeholder
  }
  if (meta.given_name || meta.family_name) {
    const realName = [meta.given_name, meta.family_name]
      .filter((n) => n)
      .join(' ')
    if (meta.nickname) {
      return `${meta.nickname} (${realName})`
    } else {
      return realName
    }
  } else if (meta.nickname) {
    return meta.nickname
  } else {
    return placeholder
  }
}

export function isMobile() {
  return navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i)
}

export function isMobileFirefox() {
  return navigator.userAgent.match(/(Android.*Firefox)/i)
}

export function faviconWidth(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth)
    img.onerror = reject
    img.src = url
  })
}
