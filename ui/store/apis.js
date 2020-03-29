import { getBoundsOfDistance } from 'geolib'
import {
  GEO,
  LEI,
  ISBN,
  subToScheme,
  subPath,
  geoUri,
  geoSubject
} from './scheme-types'

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

// Viebox should be a comma separated string.
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
            // Dealing with very weird name of place field.
            const title =
              address[type] ||
              address.address26 ||
              address.address29 ||
              address.address100 ||
              address.suburb ||
              address.city
            const addressString = [
              [address.street || address.road, address.house_number]
                .filter(Boolean)
                .join(' '),
              address.suburb,
              address.city || address.town || address.village || address.state,
              address.country
            ]
              .filter(Boolean)
              .join(', ')
            // Capitalize.
            let typeString =
              type === 'administrative'
                ? address.country
                : type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
            if (extratags.cuisine) {
              typeString =
                typeString +
                ' · ' +
                extratags.cuisine.charAt(0).toUpperCase() +
                extratags.cuisine.slice(1).replace(/;/g, ', ')
            }
            return {
              sub: geoUri(lat, lon, title),
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
      if (!info) return
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
  if (doc.isbn) {
    const subject = {
      sub: `${ISBN}:${doc.isbn[0]}`,
      scheme: ISBN,
      // Display colon only if title ends with letter or number
      title: doc.subtitle
        ? `${doc.title}${doc.title.match(/[A-Za-z0-9]$/) ? ':' : ''} ${
            doc.subtitle
          }`
        : doc.title,
      subtitle: `by ${doc.author_name && doc.author_name.join(', ')}`,
      description: `Published ${doc.first_publish_year} · ${doc.isbn.length} editions`,
      isbn: doc.isbn[0],
      website: `https://openlibrary.org${doc.key}`,
      subjects: doc.subject
    }
    if (doc.cover_i) {
      subject.image = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
    }
    return subject
  }
}

// Makes appropriate queries to learn more about the subject.
export async function subToSubject(axios, sub) {
  const scheme = subToScheme(sub)
  let subject
  if (scheme === LEI) {
    subject = await leiToSubject(axios, subPath(LEI, sub))
  } else if (scheme === GEO) {
    const geo = geoSubject(sub)
    // Convert from meters to degrees.
    const box = getBoundsOfDistance(geo.coordinates, geo.uncertainty)
    const viewbox = [
      box[0].longitude,
      box[0].latitude,
      box[1].longitude,
      box[1].latitude
    ]
    const subjects = await searchGeo(axios, geo.query, viewbox.join(','))
    if (subjects[0]) {
      subject = subjects[0]
      subject.sub = sub
      subject.coordinates = geo.coordinates
    }
  } else if (scheme === ISBN) {
    subject = await isbnToSubject(axios, subPath(ISBN, sub))
  }
  if (!subject) {
    subject = {
      sub,
      scheme,
      title: sub,
      subtitle: '',
      description: ''
    }
  }
  return subject
}
