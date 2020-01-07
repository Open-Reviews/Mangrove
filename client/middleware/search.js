import {
  EMPTY_SUBJECTS,
  ADD_SUBJECTS,
  SEARCH_ERROR,
  SET_QUERY,
  START_SEARCH,
  STOP_SEARCH
} from '~/store/mutation-types'
import { HTTPS, GEO, LEI, ISBN, MARESI } from '~/store/scheme-types'

/*
Searches for subjects and returns and object for each:
{
  sub: URI,
  scheme: store/scheme-types,
  title: String,
  subtitle: String,
  description: String,
  isbn: Option<String>,
  coordinates: Option<[lon, lat]>,
  website: Option<String>,
  openingHours: Option<String>,
  ownership: Option<String>,
  lei: Option<String>,
  image: Option<Url>,
  language: Option<String>,
  subjects: Option<Vec<String>>,
  importance: Option<Number>
}

*/

export default function({ store, $axios, route }) {
  const query = route.query.q
  // Do not run if there is no query and specific subject is not selected.
  if (
    !query ||
    // Do not run if query is the same or geo query is the same.
    (store.state.query.q === query && store.state.query.geo === route.query.geo)
  ) {
    return
  }
  // Stop it only once display is complete.
  store.commit(START_SEARCH)
  store.commit(EMPTY_SUBJECTS)
  store.commit(SET_QUERY, { q: query, geo: route.query.geo })
  const queries = Promise.all([
    storeWithRating(store, searchUrl(query)),
    searchGeo($axios, query, route.query.geo)
      .then((subjects) => storeWithRating(store, subjects))
      .catch((error) => {
        store.commit(
          SEARCH_ERROR,
          `Places search: the OpenStreetMap server could not be reached.
          Please try again in a few minutes.`
        )
        console.log('Nominatim error: ', error)
      }),
    searchIsbn($axios, query)
      .then((subjects) => storeWithRating(store, subjects))
      .catch((error) => {
        store.commit(
          SEARCH_ERROR,
          `Books search: the Open Library server could not be reached.
          Please try again in a few minutes.`
        )
        console.log('OpenLibrary error: ', error)
      }),
    searchLei($axios, query)
      .then((subjects) => storeWithRating(store, subjects))
      .catch((error) => {
        store.commit(
          SEARCH_ERROR,
          `Company search: The GLEIF server for company data could not be reached.
        Please try again in a few minutes.`
        )
        console.log('GLEIF error: ', error)
      }),
    store
      .dispatch('getReviews', { q: query })
      .then((rs) => {
        console.log('Response: ', rs.reviews)
        return reviewsToSubjects(rs)
      })
      .then((subjects) => storeWithRating(store, subjects))
      .catch((error) => {
        if (error.response) {
          store.commit(SEARCH_ERROR, `Error: ${JSON.stringify(error.response)}`)
        } else if (error.request) {
          store.commit(SEARCH_ERROR, `Server not reachable: ${error.request}`)
        } else {
          store.commit(
            SEARCH_ERROR,
            `Can not connect to Mangrove Server: ${error}`
          )
        }
      })
  ])
  // Select a subject even if queries take a long time to resolve.
  Promise.race([
    queries,
    new Promise((resolve) => setTimeout(resolve, 2000))
  ]).then(() => {
    // Respect the query selection.
    if (store.state.subjects[route.query.sub]) {
      store.dispatch('selectSubject', [route.query, route.query.sub])
    }
    store.commit(STOP_SEARCH)
  })
}

function storeWithRating(store, rawSubjects) {
  rawSubjects.length &&
    store
      .dispatch(
        'bulkSubjects',
        rawSubjects.map((raw) => raw.sub)
      )
      .then((subjects) => {
        if (subjects) {
          rawSubjects.map((raw) => {
            const rawQuality = subjects[raw.sub].quality
            // Quality is null when there are no reviews.
            subjects[raw.sub].quality = rawQuality && (rawQuality + 25) / 25
            subjects[raw.sub] = { ...raw, ...subjects[raw.sub] }
          })
          store.commit(ADD_SUBJECTS, subjects)
        }
      })
}

function searchUrl(input) {
  const search = []
  if (input.includes('.')) {
    // Use a very basic test if the query is a URL,
    // people rarely use period in queries otherwise.
    // Try to recover a valid url.
    const url = new URL(input.startsWith('http') ? input : `https://${input}`)
    const urlString = `${url.protocol}//${url.hostname}`
    if (url) {
      search.push({
        sub: urlString,
        // Remove the trailing colon
        scheme: HTTPS,
        title: url.hostname,
        subtitle: '',
        description: '',
        website: urlString
      })
    }
  }
  return search
}

const GEO_IGNORE_CLASSES = ['highway']

function searchGeo(axios, q, viewbox) {
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

function searchIsbn(axios, input) {
  return axios
    .get('https://openlibrary.org/search.json', {
      params: {
        q: input
      },
      headers: { Accept: 'application/json' }
    })
    .then((response) => {
      return response.data.docs
        .map((doc) => {
          return doc.isbn
            ? {
                sub: `${ISBN}:${doc.isbn[0]}`,
                scheme: ISBN,
                title: doc.subtitle
                  ? `${doc.title}: ${doc.subtitle}`
                  : doc.title,
                subtitle: `by ${doc.author_name && doc.author_name.join(', ')}`,
                description: `Published ${doc.first_publish_year} · ${doc.isbn.length} editions`,
                isbn: doc.isbn[0],
                website: `https://openlibrary.org${doc.key}`,
                image: `http://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
                subjects: doc.subject
              }
            : null
          // Filter out duplicates and entities without isbn.
        })
        .filter(Boolean)
    })
}

function searchLei(axios, query) {
  return axios
    .get('https://api.gleif.org/api/v1/fuzzycompletions', {
      params: {
        field: 'fulltext',
        q: query
      },
      headers: { 'Content-Type': 'application/vnd.api+json' }
    })
    .then((response) => {
      return Promise.all(
        response.data.data.map(
          (completion) => {
            return completion.relationships
              ? entityLookup(
                  axios,
                  completion.relationships['lei-records'].data.id
                )
                  .then((entity) => entity.attributes)
                  .then(async ({ entity, lei }) => {
                    const address = entity.legalAddress
                    const form = entity.legalForm
                    return {
                      sub: `${LEI}:${lei}`,
                      scheme: LEI,
                      title: entity.legalName.name,
                      description: `${address.addressLines.join(', ')}, ${
                        address.city
                      } ${address.postalCode} · ${address.country}`,
                      // Do the check only if there is valid id.
                      subtitle: `${form.other ||
                        (await entityForm(axios, form.id))} · ${entity.status}`,
                      lei
                    }
                  })
              : null
          } // When no related entity return null.
        )
      ).then((entities) => {
        // Filter out duplicates and entities without relationship.
        return entities.filter(Boolean)
      })
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

// TODO: make appropriate queries to learn more about these
function reviewsToSubjects(reviews) {
  return reviews.reviews
    ? reviews.reviews
        .map(({ payload }) => {
          const uri = new URL(payload.sub)
          const subject = {
            sub: payload.sub,
            // Strip the colon.
            scheme: uri.protocol.slice(0, -1),
            title: payload.sub,
            subtitle: '',
            description: ''
          }
          if (subject.scheme === GEO) {
            const splitQuery = uri.searchParams.get('q').split(',')
            subject.coordinates = [splitQuery[0], splitQuery[1].split('(')[0]]
          }
          return subject
        })
        .filter(({ scheme }) => scheme !== MARESI)
    : []
}
