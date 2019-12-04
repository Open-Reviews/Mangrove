import { OpenStreetMapProvider } from 'leaflet-geosearch'
import {
  EMPTY_URIS,
  ADD_URIS,
  SELECT_SUB,
  SEARCH_ERROR
} from '../store/mutation-types'

const geoProvider = new OpenStreetMapProvider()

export default function({ store, $axios, route }) {
  const query = route.query.q
  if (!query) {
    return
  }
  store.commit(EMPTY_URIS)
  Promise.all([
    searchUrl($axios, query).then((subs) => store.commit(ADD_URIS, subs)),
    searchGeo(query).then((subs) => store.commit(ADD_URIS, subs)),
    searchLei($axios, query).then((subs) => store.commit(ADD_URIS, subs)),
    store
      .dispatch('requestReviews', { q: query })
      .then((rs) => {
        return rs
          ? rs.map((r) => {
              return {
                sub: r.sub,
                scheme: new URL(r.sub).protocol,
                profile: {}
              }
            })
          : []
      })
      .then((subs) => store.commit(ADD_URIS, subs))
  ])
    .then(() => {
      store.commit(SEARCH_ERROR, null)
      // Try to select the first URI from the list.
      const first = store.state.subs[0]
      store.commit(SELECT_SUB, first)
      if (first) store.dispatch('saveReviews', { sub: first.sub })
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

function searchUrl(axios, input) {
  return axios
    .get(
      'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/WebSearchAPI',
      {
        params: {
          autoCorrect: 'true',
          pageNumber: '1',
          pageSize: '5',
          q: input,
          safeSearch: 'false'
        },
        headers: {
          'x-rapidapi-host': 'contextualwebsearch-websearch-v1.p.rapidapi.com',
          'x-rapidapi-key': '251214c417msh8d97fdc071044acp196e11jsn6aae035600e6'
        }
      }
    )
    .then((response) => {
      return response.data.value.map((result) => {
        return {
          sub: result.url,
          scheme: new URL(result.url).protocol,
          profile: { title: result.title, description: result.description }
        }
      })
    })
    .then((search) => {
      if (input.includes('.')) {
        // Use a very basic test if the query is a URL,
        // people rarely use period in queries otherwise.
        // Try to recover a valid url.
        const url = new URL(
          input.startsWith('http') ? input : `https://${input}`
        )
        if (url) {
          search.push({
            sub: `${url.protocol}//${url.hostname}`,
            // Remove the trailing colon
            scheme: url.protocol.slice(0, -1),
            profile: { title: url.hostname, description: '' }
          })
        }
      }
      return search
    })
}

function searchGeo(input) {
  // Do Nominatim and Mangrove server uncertain viscinity/fragment text search.
  return geoProvider.search({ query: input }).then((results) =>
    // Compute Geo URI for each result, introducing default uncertainty of the POI of 30 meters.
    results.map((result) => {
      const label = encodeURI(
        result.label.substring(0, result.label.indexOf(','))
      )
      return {
        sub: `geo:?q=${result.y},${result.x}(${label})&u=30`,
        scheme: 'geo',
        profile: { title: label, description: result.label }
      }
    })
  )
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
                  .then((attrs) => {
                    return {
                      sub: `urn:lei:${attrs.lei}`,
                      scheme: 'urn:lei',
                      profile: {
                        title: attrs.entity.legalName.name,
                        description: [
                          attrs.entity.legalAddress.addressLines,
                          attrs.entity.legalAddress.city,
                          attrs.entity.legalAddress.country
                        ]
                      }
                    }
                  })
              : null
          } // When no related entity return null.
        )
      ).then((entities) => {
        // Filter out duplicates and entities without relationship.
        return Array.from(new Set(entities)).filter(
          (entity, index, self) =>
            entity && self.findIndex((e) => e && e.sub === entity.sub) === index
        )
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
