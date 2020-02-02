import {
  EMPTY_SUBJECTS,
  SEARCH_ERROR,
  SET_QUERY,
  START_SEARCH,
  STOP_SEARCH
} from '~/store/mutation-types'
import { HTTPS, MARESI } from '~/store/scheme-types'
import {
  subsToSubjects,
  leiToSubject,
  searchGeo,
  olDocToSubject
} from '~/store/apis'

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
    return
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
  // Do not empty too ealy so that search message has time to render.
  store.commit(EMPTY_SUBJECTS)
  const queries = Promise.all([
    searchUrl($axios, query)
      .then((subjects) => store.dispatch('storeWithRating', subjects))
      .catch((error) => console.log('Not a website: ', error)),
    searchGeo($axios, query, route.query.geo)
      .then((subjects) => store.dispatch('storeWithRating', subjects))
      .catch((error) => {
        store.commit(
          SEARCH_ERROR,
          `Places search: the OpenStreetMap server could not be reached.
          Please try again in a few minutes.`
        )
        console.log('Nominatim error: ', error)
      }),
    searchIsbn($axios, query)
      .then((subjects) => store.dispatch('storeWithRating', subjects))
      .catch((error) => {
        store.commit(
          SEARCH_ERROR,
          `Books search: the Open Library server could not be reached.
          Please try again in a few minutes.`
        )
        console.log('OpenLibrary error: ', error)
      }),
    searchLei($axios, query)
      .then((subjects) => store.dispatch('storeWithRating', subjects))
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
        if (!rs) throw new Error('empty response')
        if (!rs.reviews.length) return
        subsToSubjects(
          $axios,
          rs.reviews.map((review) => review.payload.sub)
        )
      })
      .then(
        (allSubjects) =>
          allSubjects &&
          store.dispatch(
            'storeWithRating',
            allSubjects.filter(({ scheme }) => scheme !== MARESI)
          )
      )
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
    store.commit(STOP_SEARCH)
  })
}

async function searchUrl(axios, input) {
  // Try to recover a valid url.
  const url = new URL(input.startsWith('http') ? input : `https://${input}`)
  if (!url) {
    return
  }
  const urlString = `${url.protocol}//${url.hostname}`
  const icoWidth = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth)
    img.onerror = reject
    img.src = urlString + '/favicon.ico'
  })
  console.log('width: ', icoWidth)
  if (icoWidth) {
    return [
      {
        sub: urlString,
        // Remove the trailing colon
        scheme: HTTPS,
        title: url.hostname,
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
