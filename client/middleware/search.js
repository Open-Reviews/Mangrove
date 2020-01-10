import {
  EMPTY_SUBJECTS,
  ADD_SUBJECTS,
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
        return subsToSubjects(
          $axios,
          rs.reviews.map((review) => review.payload.sub)
        )
      })
      .then((allSubjects) =>
        storeWithRating(
          store,
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
    // Respect the query selection.
    if (store.getters.subject(route.query.sub)) {
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
