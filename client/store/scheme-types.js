export const HTTPS = 'https'
export const GEO = 'geo'
export const LEI = 'urn:lei'
export const ISBN = 'urn:isbn'
export const MARESI = 'urn:maresi'

export const NAMES = {
  [HTTPS]: 'Website',
  [GEO]: 'Place',
  [LEI]: 'Company',
  [ISBN]: 'Book',
  [MARESI]: 'Review'
}

export function subToScheme(sub) {
  let scheme
  if (sub.startsWith(GEO)) {
    scheme = GEO
  } else if (sub.startsWith(HTTPS)) {
    scheme = HTTPS
  } else if (sub.startsWith(LEI)) {
    scheme = LEI
  } else if (sub.startsWith(ISBN)) {
    scheme = ISBN
  } else if (sub.startsWith(MARESI)) {
    scheme = MARESI
  }
  return scheme
}

export function subPath(scheme, sub) {
  sub.replace(new RegExp(`^(${scheme}.)`), '')
  return sub
}
