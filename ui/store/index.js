import Vue from 'vue'
import { get, set } from 'idb-keyval'
import { isPointWithinRadius } from 'geolib'
import {
  generateKeypair,
  jwkToKeypair,
  keypairToJwk,
  publicToPem,
  signReview,
  submitReview,
  getSubject,
  getIssuer,
  batchAggregate,
  getReviews
} from 'mangrove-reviews'
import { MARESI, GEO, subToScheme, geoSubject, subPath, HTTPS, LEI, ISBN } from './scheme-types'
import { subToSubject } from './apis'
import { PRIVATE_KEY } from './indexeddb-types'
import * as t from './mutation-types'
import { CLIENT_ID, RECURRING } from './metadata-types'

export const state = () => ({
  keyPair: null,
  publicKey: null,
  // Should the beta warning be displayed.
  betaWarning: true,
  // Have the latest reviews for display been fetched.
  fetchedDisplay: false,
  isSearching: false,
  searchResultsRead: true,
  // Current query - gets out of line with URL only when changed.
  query: { q: null, geo: null },
  // A list of URIs which are retrieved for the current search term.
  searchResults: [],
  // Object from sub (URI) to subject info, see `middleware/search.js` for details.
  subjects: {},
  // Scheme that should be selected, null means display all.
  filter: null,
  // Object from MaReSi to reviews, ensuring only unique ones are stored.
  reviews: {},
  // Object from public keys to information about issuers.
  issuers: {},
  metadata: {},
  errors: { import: null, search: null, request: null, submit: null }
})

export const mutations = {
  [t.SET_KEYS](state, { keyPair, publicKey }) {
    state.keyPair = keyPair
    state.publicKey = publicKey
    state.metadata = {}
  },
  [t.DISMISS_BETA_WARNING](state) {
    state.betaWarning = false
  },
  [t.FETCHED_DISPLAY](state) {
    state.fetchedDisplay = true
  },
  [t.START_SEARCH](state) {
    state.isSearching = true
    state.errors.search = null
    state.searchResults = []
  },
  [t.STOP_SEARCH](state) {
    state.isSearching = false
    state.searchResultsRead = false
  },
  [t.ADD_RESULTS](state, newresults) {
    // Ensure results are unique and avoid Set reactivity issues.
    state.searchResults = [...new Set([...state.searchResults, ...newresults])]
  },
  [t.SET_QUERY](state, query) {
    state.query = query
  },
  [t.ADD_SUBJECTS](state, newsubjects) {
    state.subjects = { ...state.subjects, ...newsubjects }
  },
  [t.ADD_ISSUERS](state, newissuers) {
    state.issuers = { ...state.issuers, ...newissuers }
  },
  [t.SET_FILTER](state, filter) {
    state.filter = filter
  },
  [t.ADD_REVIEWS](state, newreviews) {
    if (newreviews) {
      newreviews.map((review) =>
        Vue.set(state.reviews, review.signature, review)
      )
    }
  },
  [t.SET_META](state, [key, value]) {
    Vue.set(state.metadata, key, value === '' ? null : value)
  },
  [t.SEARCH_ERROR](state, error) {
    state.errors.search = error
  },
  [t.REQUEST_ERROR](state, error) {
    state.errors.request = error
  },
  [t.SUBMIT_ERROR](state, error) {
    state.errors.submit = error
  },
  [t.SET_SEARCH_RESULTS_AS_READ](state) {
    state.searchResultsRead = true
  }
}

export const getters = {
  subject: (state) => (sub) => {
    return state.subjects[sub] || console.log('not present in subjects', sub)
  },
  issuer: (state) => (kid) => {
    return state.issuers[kid] || console.log('not present in issuers', kid)
  },
  isUnique: (state) => (newPayload) => {
    return (
      Object.values(state.reviews).filter(
        ({ payload }) =>
          newPayload.sub === payload.sub &&
          newPayload.rating === payload.rating &&
          newPayload.opinion === payload.opinion
      ).length === 0
    )
  },
  mapPoints: (state, getters) => (query) => {
    let subjects
    // If not query provided, use the search results.
    if (!query) {
      subjects = state.searchResults
        .map((sub) => getters.subject(sub))
        .filter((subject) => subject.scheme === GEO)
    } else {
      // Otherwise get points for all review matching query.

      const allSubjects = getters
        .reviewsAndCounts({ ...query, scheme: GEO })
        .reviews.map((review) => getters.subject(review.payload.sub))
      subjects = [...new Set(allSubjects)]
    }
    return subjects.filter(subject => subject && subject.coordinates).map((subject) => {
      return {
        id: subject.sub,
        coordinates: subject.coordinates
      }
    })
  },
  // Return the filtered list of reviews and total counts for different schemes.
  reviewsAndCounts: (state) => (query) => {
    if (state.filter) query = { ...query, scheme: state.filter }
    const counts = {}
    let reaction_count = 0;
    const allReviews = Object.values(state.reviews)
    // Prelimit to circumvent JS eager eval.
    const reviews = (query.limit
      ? allReviews.slice(0, query.limit * 5)
      : allReviews
    )
      .filter(({ payload, kid, scheme, geo, signature }) => {
        // Pick only ones selected according to query.
        const isReaction = scheme == MARESI && !payload.opinion;
        const isSelected =
          (!query.kid || query.kid === kid) &&
          (!query.scheme || query.scheme === scheme || (query.scheme === 'reaction' && isReaction)) &&
          (!query.opinionated || payload.opinion) &&
          Object.entries(query)
            .map(([k, v]) => {
              if (
                ['kid', 'scheme', 'opinionated', 'limit'].includes(k) ||
                payload[k] === v
              ) {
                return true
              } else if (k === 'sub' && scheme === GEO) {
                // TODO: remove after db upgrade
                if (!geo || !v) return false
                const geoQuery = geoSubject(v)
                return isPointWithinRadius(
                  geoQuery.coordinates,
                  geo.coordinates,
                  geo.uncertainty + geoQuery.uncertainty
                )
              } else if (k === 'signature' && signature === v) {

                return true
              } else if (k === 'scheme' && v === 'reaction' && isReaction) {
                return true
              } else {
                return false
              }
            })
            .every(Boolean)
        if (isSelected) {
          if (scheme == MARESI && !payload.opinion) {
            reaction_count++;
          } else {
            counts[scheme] = counts[scheme] ? counts[scheme] + 1 : 1
          }
        }
        return isSelected
      })
      .sort((r1, r2) => r2.payload.iat - r1.payload.iat)
    counts.null = Object.values(counts).reduce((a, b) => a + b, 0);
    counts.reactions = reaction_count;
    return { counts, reviews }
  }
}

export const actions = {
  async setKeypair({ commit }, keyPair) {
    const publicKey = await publicToPem(keyPair.publicKey)
    commit(t.SET_KEYS, { keyPair, publicKey })
    const jwk = await keypairToJwk(keyPair)
    set(PRIVATE_KEY, jwk)
  },
  // Storage in IndexedDB is done as jwk instead CryptoKey due to two issues:
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1048931
  // https://gitlab.com/open-reviews/mangrove/issues/6
  async generateKeypair({ commit, dispatch }) {
    let keypair
    await get(PRIVATE_KEY)
      .then(async (jwk) => {
        if (jwk) {
          try {
            keypair = await jwkToKeypair(jwk)
            return
          } catch (e) {
            console.log('Bad key in IndexDB:', jwk)
          }
        } else {
          await generateKeypair()
            .then((kp) => {
              keypair = kp
            })
            .catch((error) => console.log('Accessing IndexDB failed: ', error))
        }
        await generateKeypair()
          .then((kp) => {
            keypair = kp
            keypairToJwk(kp).then((jwk) => set(PRIVATE_KEY, jwk))
          })
          .catch((error) => console.log('Accessing IndexDB failed: ', error))
      })
      .catch((error) => console.log('Accessing IndexDB failed: ', error))
    await dispatch('setKeypair', keypair)
  },
  // Fetch reviews mathing params from the server.
  getReviews({ commit }, query) {
    return getReviews(query, process.env.VUE_APP_API_URL)
      .then((response) => {
        commit(t.REQUEST_ERROR, null)
        return response
      })
      .catch((error) => {
        if (error.response) {
          console.log(error.response.status)
          console.log(error.response.headers)
          commit(t.REQUEST_ERROR, error.response.data)
        } else if (error.request) {
          console.log(error.request)
          commit(t.REQUEST_ERROR, 'Server not reachable.')
        } else {
          console.log('Client request processing error: ', error.message)
          commit(t.REQUEST_ERROR, 'Internal client error, please report.')
        }
      })
  },
  // Fetch reviews mathing params from the server and save the locally.
  saveReviews({ commit, dispatch }, inParams) {
    const params = { ...inParams, issuers: true, maresi_subjects: true }
    // Get and save in state the reviews and their issuers.
    return dispatch('getReviews', params).then((rs) => {
      if (rs) {
        commit(t.ADD_ISSUERS, rs.issuers)
        Object.keys(rs.maresi_subjects).map((maresi) => {
          rs.maresi_subjects[maresi].scheme = MARESI
        })
        commit(t.ADD_SUBJECTS, rs.maresi_subjects)
        commit(t.ADD_REVIEWS, rs.reviews)
      }
      return rs
    })
  },
  async saveReviewsWithSubjects({ state, dispatch }, params) {
    const rs = await dispatch('saveReviews', params)
    if (!rs || !rs.reviews.length) return
    const subs = Object.values(rs.reviews).map((review) => review.payload.sub)
    const subjects = await Promise.all(
      subs.map((sub) => state.subjects[sub] || subToSubject(this.$axios, sub))
    )
    await dispatch('storeWithRating', subjects)
    return rs
  },
  async saveMyReviews({ state, dispatch, commit }, metadata = false) {
    // Avoid querying for all reviews.
    console.log('Saving reviews for: ', state.publicKey)
    if (!state.publicKey) return
    const rs = await dispatch('saveReviewsWithSubjects', {
      kid: state.publicKey
    })
    if (rs && metadata) {
      const newestReview = rs.reviews.reduce(function (prev, current) {
        const isNewer = current.payload.iat > prev.payload.iat
        const hasData = Object.keys(current.payload.metadata).some((k) =>
          RECURRING.includes(k)
        )
        return isNewer && hasData ? current : prev
      })
      Object.entries(newestReview.payload.metadata).map(([k, v]) => {
        RECURRING.includes(k) && commit(t.SET_META, [k, v])
      })
    }
    return rs
  },
  bulkSubjects({ commit }, subs) {
    return batchAggregate({ subs }, process.env.VUE_APP_API_URL)
      .then((response) => {
        commit(t.REQUEST_ERROR, null)
        return response.subjects
      })
      .catch((error) => {
        console.log('Client request processing error: ', error)
        if (error.response) {
          commit(t.REQUEST_ERROR, error.response.data)
        } else if (error.request) {
          commit(t.REQUEST_ERROR, 'Server not reachable.')
        } else {
          commit(t.REQUEST_ERROR, 'Internal client error, please report.')
        }
      })
  },
  storeWithRating({ commit, dispatch }, rawSubjects) {
    return (
      rawSubjects.length &&
      dispatch(
        'bulkSubjects',
        rawSubjects.map((raw) => raw.sub)
      ).then((subjects = {}) => {
        rawSubjects.map((raw) => {
          subjects[raw.sub] = { ...raw, ...subjects[raw.sub] }
        })
        commit(t.ADD_SUBJECTS, subjects)
      })
    )
  },
  storeResults({ dispatch, commit }, subjects) {
    dispatch('storeWithRating', subjects).then(() =>
      commit(
        t.ADD_RESULTS,
        subjects
          .filter(({ scheme }) => scheme && scheme !== MARESI)
          .map((subject) => subject.sub)
      )
    )
  },
  async reviewContent({ state }, payload) {
    if (payload.metadata) {
      payload.metadata = { ...payload.metadata, ...state.metadata }
    } else {
      payload.metadata = state.metadata
    }
    payload.metadata[CLIENT_ID] = process.env.BASE_URL
    const jwt = await signReview(state.keyPair, payload)
    let review = {
      jwt,
      kid: state.publicKey,
      payload,
      signature: jwt.split('.')[2],
      scheme: subToScheme(payload.sub)
    }
    if (review.scheme === GEO) {
      review = { ...review, ...geoSubject(payload.sub) }
    }
    return review
  },
  submitReview({ getters, commit, dispatch }, reviewStub) {
    return dispatch('reviewContent', reviewStub).then((review) => {
      if (!getters.isUnique(review.payload)) {
        commit(t.SUBMIT_ERROR, 'You have already submitted this review.')
        return false
      }
      console.log('Mangrove review: ', review)
      return submitReview(review.jwt, process.env.VUE_APP_API_URL)
        .then(() => {
          commit(t.SUBMIT_ERROR, null)
          // Add review so that its immediately visible.
          return dispatch('getSubject', `${MARESI}:${review.signature}`)
        })
        .then(() => {
          commit(t.ADD_REVIEWS, [review])
          return true
        })
        .catch((error) => {
          if (error.response) {
            console.log(error.response.status)
            console.log(error.response.headers)
            commit(t.SUBMIT_ERROR, error.response.data)
          } else if (error.request) {
            console.log(error.request)
            commit(t.SUBMIT_ERROR, 'Mangrove Server not reachable.')
          } else {
            commit(
              t.SUBMIT_ERROR,
              `Internal client error, please report: ${error.message}`
            )
          }
          return false
        })
    })
  },
  // Adjust the route and save reviews for the given subject locally.
  selectSubject({ commit, dispatch }, [oldQuery, sub]) {
    console.log('Selecting subject: ', sub)
    const query = { sub, q: oldQuery.q, [GEO]: oldQuery.geo }
    commit(t.SET_QUERY, query)
    this.app.router.push({
      path: '/search',
      query
    })
    dispatch('saveReviews', { sub })
  },
  async selectComment({ commit, dispatch }, [oldQuery, sub]) {
    console.log('Selecting comment: ', sub)
    const query = { signature: subPath(MARESI, sub) }

    commit(t.SET_QUERY, query)
    this.app.router.push({
      path: '/list',
      query
    }, () => location.reload())
    dispatch('saveReviews', { sub })
  },
  getIssuer({ getters, commit }, pubkey) {
    return (
      getters.issuer(pubkey) ||
      getIssuer(pubkey, process.env.VUE_APP_API_URL).then((issuer) => {
        commit(t.ADD_ISSUERS, { [pubkey]: issuer })
        return issuer
      })
    )
  },
  getSubject({ commit }, subject) {
    getSubject(subject, process.env.VUE_APP_API_URL).then((subject) => {
      subject.scheme = subToScheme(subject.sub)
      commit(t.ADD_SUBJECTS, { [subject.sub]: subject })
      return subject
    })
  }
}
