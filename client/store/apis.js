import { GEO, LEI, ISBN, subToScheme, subPath } from './scheme-types'

export function leiToSubject(axios, lei) {
  return entityLookup(axios, lei)
    .then((entity) => entity.attributes)
    .then(async ({ entity, lei }) => {
      const address = entity.legalAddress
      const form = entity.legalForm
      return {
        sub: `${LEI}:${lei}`,
        scheme: LEI,
        title: entity.legalName.name,
        description: `${address.addressLines.join(', ')}, ${address.city} ${
          address.postalCode
        } · ${address.country}`,
        // Do the check only if there is valid id.
        subtitle: `${form.other || (await entityForm(axios, form.id))} · ${
          entity.status
        }`,
        lei
      }
    })
}

function entityLookup(axios, lei) {
  return axios
    .get(`https://api.gleif.org/api/v1/lei-records/${lei}`, {
      headers: { 'Content-Type': 'application/vnd.api+json' }
    })
    .then((response) => {
      return response.data.data
    })
}

function entityForm(axios, elf) {
  return axios
    .get(`https://api.gleif.org/api/v1/entity-legal-forms/${elf}`, {
      headers: { 'Content-Type': 'application/vnd.api+json' }
    })
    .then((response) => {
      const list = response.data.data.attributes.names
      const english = list.find((local) => local.languageCode === 'en')
      const picked = english || list[0]
      return picked.localName
    })
}

const GEO_IGNORE_CLASSES = ['highway']

export function searchGeo(axios, q, viewbox) {
  const params = {
    q,
    format: 'json',
    limit: 40,
    addressdetails: 1,
    extratags: 1
  }
  if (viewbox) {
    params.viewbox = viewbox
    params.bounded = 1
  }
  return axios
    .get('https://nominatim.openstreetmap.org/search', {
      params,
      headers: { Accept: 'application/json' }
    })
    .then((response) => {
      return response.data
        .map(
          ({
            class: placeClass,
            lat,
            lon,
            type,
            address,
            extratags,
            importance
          }) => {
            if (
              !lat ||
              !lon ||
              GEO_IGNORE_CLASSES.some((filter) => filter === placeClass)
            ) {
              return null
            }
            const title = address[type]
            const addressString = [
              [address.street || address.road, address.house_number]
                .filter(Boolean)
                .join(' '),
              address.suburb,
              address.city || address.town || address.state,
              address.country
            ]
              .filter(Boolean)
              .join(', ')
            // Capitalize.
            let typeString =
              type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
            if (extratags.cuisine) {
              typeString =
                typeString +
                ' · ' +
                extratags.cuisine.charAt(0).toUpperCase() +
                extratags.cuisine.slice(1).replace(/;/g, ', ')
            }
            return {
              sub: `${GEO}:?q=${lat},${lon}(${title})&u=30`,
              scheme: GEO,
              title,
              subtitle: typeString,
              description: addressString,
              openingHours:
                extratags.opening_hours &&
                extratags.opening_hours.replace(/, /g, '<br />'),
              website: extratags.url || extratags['contact:website'],
              phone: extratags.phone || extratags['contact:phone'],
              coordinates: [lon, lat].map(parseFloat),
              importance
            }
          }
        )
        .filter(Boolean)
    })
}

function isbnToSubject(axios, isbn) {
  const key = `isbn:${isbn}`
  return axios
    .get(
      `https://openlibrary.org/api/books?bibkeys=${key}&format=json&jscmd=data`,
      {
        headers: { Accept: 'application/json' }
      }
    )
    .then((response) => {
      console.log('isbn lookup: ', response)
      const info = response.data[key]
      return {
        sub: `${ISBN}:${isbn}`,
        scheme: ISBN,
        title: info.title,
        subtitle: `by ${info.authors &&
          info.authors.map(({ name }) => name).join(', ')}`,
        description: `Published ${info.publish_date}`,
        isbn,
        website: `https://openlibrary.org${info.key}`,
        image: info.cover.medium,
        subjects: info.subjects.map(({ name }) => name)
      }
    })
}

export function olDocToSubject(doc) {
  return doc.isbn
    ? {
        sub: `${ISBN}:${doc.isbn[0]}`,
        scheme: ISBN,
        title: doc.subtitle ? `${doc.title}: ${doc.subtitle}` : doc.title,
        subtitle: `by ${doc.author_name && doc.author_name.join(', ')}`,
        description: `Published ${doc.first_publish_year} · ${doc.isbn.length} editions`,
        isbn: doc.isbn[0],
        website: `https://openlibrary.org${doc.key}`,
        image: `http://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
        subjects: doc.subject
      }
    : null
}

// TODO: make appropriate queries to learn more about these
export function subsToSubjects(axios, subs) {
  return subs
    ? subs.map(async (sub) => {
        const scheme = subToScheme(sub)
        let subject
        if (scheme === LEI) {
          subject = await leiToSubject(axios, subPath(LEI, sub))
        } else if (scheme === GEO) {
          const splitQuery = new URL(sub).searchParams.get('q').split(',')
          const coordinates = [splitQuery[0], splitQuery[1].split('(')[0]]
          const subjects = await searchGeo(
            axios,
            splitQuery[1].split('(')[1],
            coordinates
          )
          subject = subjects[0]
        } else if (scheme === ISBN) {
          subject = await isbnToSubject(axios, subPath(ISBN, sub))
        } else {
          subject = {
            sub,
            scheme,
            title: sub,
            subtitle: '',
            description: ''
          }
        }
        return subject
      })
    : []
}
