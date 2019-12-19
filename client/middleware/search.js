import {
  EMPTY_SUBJECTS,
  ADD_SUBJECTS,
  SEARCH_ERROR,
  SET_QUERY
} from '../store/mutation-types'
import { HTTPS, GEO, LEI, ISBN } from '../store/scheme-types'

export default function({ store, $axios, route }) {
  const query = route.query.q
  if (
    !query ||
    (store.state.query.q === query && store.state.query.geo === route.query.geo)
  ) {
    return
  }
  store.commit(EMPTY_SUBJECTS)
  store.commit(SET_QUERY, { q: query, geo: route.query.geo })
  Promise.all([
    storeWithRating(store, searchUrl(query)),
    searchGeo($axios, query, route.query.geo).then((subjects) =>
      storeWithRating(store, subjects)
    ),
    searchIsbn($axios, query).then((subjects) =>
      storeWithRating(store, subjects)
    ),
    searchLei($axios, query).then((subjects) =>
      storeWithRating(store, subjects)
    ),
    // TODO: make appropriate queries to learn more about these
    store
      .dispatch('getReviews', { q: query })
      .then((rs) => {
        console.log('Response: ', rs.reviews)
        return rs.reviews
          ? rs.reviews.map((r) => {
              return {
                sub: r.sub,
                scheme: HTTPS,
                title: '',
                subtitle: '',
                description: ''
              }
            })
          : []
      })
      .then((subjects) => storeWithRating(store, subjects))
  ])
    .then(() => {
      store.commit(SEARCH_ERROR, null)
      // Try to select the first URI from the list or the one from route.
      const first = Object.values(store.state.subjects)[0]
      const selected = store.state.subjects[route.query.sub]
        ? route.query.sub
        : first && first.sub
      store.dispatch('selectSubject', [route.query, selected])
    })
    .catch((error) => {
      if (error.response) {
        store.commit(
          SEARCH_ERROR,
          `Error: ${error.response.status}, ${error.response.headers}, ${error.response.data}`
        )
      } else if (error.request) {
        store.commit(
          SEARCH_ERROR,
          `Server not reachable: ${error.request}, ${error.response.data}`
        )
      } else {
        store.commit(
          SEARCH_ERROR,
          `Internal client error, please report: ${error.message}`
        )
      }
      return []
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
    if (url) {
      search.push({
        sub: `${url.protocol}//${url.hostname}`,
        // Remove the trailing colon
        scheme: HTTPS,
        title: url.hostname,
        subtitle: '',
        description: ''
      })
    }
  }
  return search
}

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
        .map(({ lat, lon, type, address, extratags }) => {
          if (!lat || !lon) {
            return null
          }
          const title = address[type]
          const addressString = [
            [address.street || address.road, address.house_number]
              .filter(Boolean)
              .join(' '),
            address.suburb,
            address.city || address.town,
            address.country
          ]
            .filter(Boolean)
            .join(', ')
          return {
            sub: `${GEO}:?q=${lat},${lon}(${title})&u=30`,
            scheme: GEO,
            title,
            subtitle:
              type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
            description:
              addressString + (`<br/> ${extratags.opening_hours}` || ''),
            coordinates: [lon, lat].map(parseFloat)
          }
        })
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
                image: `http://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
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
                  .then(async (attrs) => {
                    const address = attrs.entity.legalAddress
                    const form = attrs.entity.legalForm
                    return {
                      sub: `${LEI}:${attrs.lei}`,
                      scheme: LEI,
                      title: attrs.entity.legalName.name,
                      subtitle: `${address.addressLines.join(', ')}, ${
                        address.city
                      } ${address.postalCode} · ${address.country}`,
                      // Do the check only if there is valid id.
                      description: `${form.other ||
                        (await entityForm(axios, form.id))} · ${
                        attrs.entity.status
                      }`
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
