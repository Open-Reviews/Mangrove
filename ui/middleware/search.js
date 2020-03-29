import {
  SEARCH_ERROR,
  SET_QUERY,
  START_SEARCH,
  STOP_SEARCH
} from '~/store/mutation-types'
import { HTTPS, GEO, ISBN, LEI } from '~/store/scheme-types'
import {
  subToSubject,
  leiToSubject,
  searchGeo,
  olDocToSubject
} from '~/store/apis'
import { faviconWidth } from '~/utils'

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
  if (!query && route.query.sub) {
    return subToSubject($axios, route.query.sub).then(
      (subject) => subject && store.dispatch('storeResults', [subject])
    )
  } else if (
    // Do not run if there is no query and specific subject is not selected.
    !query ||
    // Do not run if query is the same or geo query is the same.
    (store.state.query.q === query && store.state.query.geo === route.query.geo)
  ) {
    return
  }
  // Stop it only once display is complete.
  store.commit(START_SEARCH)
  store.commit(SET_QUERY, { q: query, geo: route.query.geo })
  const queries = Promise.all([
    searchUrl(query)
      .then((subjects) => subjects && store.dispatch('storeResults', subjects))
      .catch((error) => console.log('Not a website: ', error)),
    searchGeo($axios, query, route.query.geo)
      .then((subjects) => store.dispatch('storeResults', subjects))
      .catch((error) => {
        store.commit(SEARCH_ERROR, GEO)
        console.log('Nominatim error: ', error)
      }),
    searchIsbn($axios, query)
      .then((subjects) => store.dispatch('storeResults', subjects))
      .catch((error) => {
        store.commit(SEARCH_ERROR, ISBN)
        console.log('OpenLibrary error: ', error)
      }),
    searchLei($axios, query)
      .then((subjects) => store.dispatch('storeResults', subjects))
      .catch((error) => {
        store.commit(SEARCH_ERROR, LEI)
        console.log('GLEIF error: ', error)
      }),
    store
      .dispatch('getReviews', { q: query })
      .then((rs) => {
        if (!rs || !rs.reviews.length) return
        return rs.reviews.map(
          (review) =>
            store.state.subjects[review.payload.sub] ||
            subToSubject($axios, review.payload.sub)
        )
      })
      .then((subjects) => subjects && store.dispatch('storeResults', subjects))
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
    new Promise((resolve) => setTimeout(resolve, 3000))
  ]).then(() => {
    store.commit(STOP_SEARCH)
  })
}

async function searchUrl(input) {
  // Assume all properly formatted URLs are websites.
  const formatted = input.startsWith('https://') && input.includes('.')
  // Try to recover a valid url.
  let url
  try {
    url = new URL(formatted ? input : `https://${input}`)
  } catch (e) {
    return
  }
  const path = url.pathname === '/' ? '' : url.pathname
  const urlString = `${url.protocol}//${url.hostname}${path}`
  let isWebsite
  if (formatted) {
    isWebsite = true
  } else {
    try {
      isWebsite = await faviconWidth(urlString + '/favicon.ico')
    } catch (e) {}
    try {
      isWebsite = await faviconWidth(urlString + '/assets/favicon.png')
    } catch (e) {}
  }
  if (isWebsite) {
    return [
      {
        sub: urlString,
        // Remove the trailing colon
        scheme: HTTPS,
        title: url.hostname + path,
        subtitle: '',
        description: '',
        website: urlString
      }
    ]
  }
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
      return (
        response.data.docs
          .map((doc) => {
            return olDocToSubject(doc)
          })
          // Filter out duplicates and entities without isbn.
          .filter(Boolean)
      )
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
              ? leiToSubject(
                  axios,
                  completion.relationships['lei-records'].data.id
                )
              : null
          } // When no related entity return null.
        )
      ).then((entities) => {
        // Filter out duplicates and entities without relationship.
        return entities.filter(Boolean)
      })
    })
}
