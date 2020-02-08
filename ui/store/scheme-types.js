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
  [MARESI]: 'Reaction'
}

export function pluralName(scheme) {
  return scheme === LEI ? 'Companies' : NAMES[scheme] + 's'
}

export const ICONS = {
  [HTTPS]: 'mdi-earth',
  [GEO]: 'mdi-map-marker',
  [LEI]: 'mdi-domain',
  [ISBN]: 'mdi-book-open-page-variant',
  [MARESI]: 'mdi-comment-text-multiple'
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
  return sub.replace(new RegExp(`^(${scheme}:)`), '')
}

export function geoUri(lat, lon, name) {
  return `${GEO}:${lat},${lon}?q=${name}&u=30`
}

const ERRORS = {
  [GEO]: `Places search: the OpenStreetMap server could not be reached.
  Please try again in a few minutes.`,
  [ISBN]: `Books search: the Open Library server could not be reached.
          Please try again in a few minutes.`,
  [LEI]: `Company search: The GLEIF server for company data could not be reached.
        Please try again in a few minutes.`
}

export function errorString(str) {
  return ERRORS[str] || str
}
