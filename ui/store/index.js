import Vue from 'vue'
import { get, set } from 'idb-keyval'
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
import { MARESI, GEO, subToScheme } from './scheme-types'
import { subsToSubjects } from './apis'
import { PRIVATE_KEY } from './indexeddb-types'
import * as t from './mutation-types'
import { CLIENT_ID, RECURRING } from './metadata-types'

export const state = () => ({
  keyPair: null,
  publicKey: null,
  alphaWarning: true,
  isSearching: false,
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
  [t.SET_KEYPAIR](state, keypair) {
    state.keyPair = keypair
  },
  [t.SET_PK](state, key) {
    state.publicKey = key
  },
  [t.DISMISS_ALPHA_WARNING](state) {
    state.alphaWarning = false
  },
  [t.START_SEARCH](state) {
    state.isSearching = true
    state.errors.search = null
    state.searchResults = []
  },
  [t.STOP_SEARCH](state) {
    state.isSearching = false
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
  mapPoints: (state) => {
    return Object.values(state.subjects)
      .filter((subject) => subject.scheme === GEO)
      .map((subject) => {
        return {
          id: subject.sub,
          coordinates: subject.coordinates
        }
      })
  },
  reviewsAndCounts: (state) => (rootSub = null, rootPk = state.publicKey) => {
    const counts = {}
    const reviews = Object.values(state.reviews)
      .filter(({ payload, kid }) => {
        // Pick only ones for selected subject or issuer.
        const isSelected = payload.sub === rootSub || kid === rootPk
        const scheme = subToScheme(payload.sub)
        const isFiltered = !state.filter || scheme === state.filter
        const isReturned = isSelected && isFiltered
        if (!state.filter && isReturned) {
          counts[scheme] = counts[scheme] ? counts[scheme] + 1 : 1
        }
        return isReturned
      })
      .sort((r1, r2) => r2.payload.iat - r1.payload.iat)
    counts.null = reviews.length
    return { counts, reviews }
  }
}

export const actions = {
  setKeypair({ commit }, keypair) {
    commit(t.SET_KEYPAIR, keypair)
    keypairToJwk(keypair).then((jwk) => set(PRIVATE_KEY, jwk))
    publicToPem(keypair.publicKey).then((pem) => commit(t.SET_PK, pem))
  },
  // Storage in IndexedDB is done as jwk instead CryptoKey due to two issues:
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1048931
  // https://gitlab.com/plantingspace/mangrove/issues/7
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
  saveReviews({ commit, dispatch }, params) {
    params.issuers = true
    params.maresi_subjects = true
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
  async saveMyReviews({ state, dispatch, commit }, metadata = false) {
    const rs = await dispatch('saveReviews', { kid: state.publicKey })
    if (!rs.reviews && !rs.reviews.length) return
    const subs = Object.values(rs.reviews).map((review) => review.payload.sub)
    subsToSubjects(this.$axios, subs).map((promise) =>
      promise.then((subject) => dispatch('storeWithRating', [subject]))
    )
    if (metadata) {
      const newestReview = rs.reviews.reduce(function(prev, current) {
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
  storeWithRating({ commit, dispatch }, rawSubjects) {
    return (
      rawSubjects.length &&
      dispatch(
        'bulkSubjects',
        rawSubjects.map((raw) => raw.sub)
      ).then((subjects) => {
        if (subjects) {
          rawSubjects.map((raw) => {
            const rawQuality = subjects[raw.sub].quality
            // Quality is null when there are no reviews.
            subjects[raw.sub].quality = rawQuality && (rawQuality + 25) / 25
            subjects[raw.sub] = { ...raw, ...subjects[raw.sub] }
          })
          commit(t.ADD_SUBJECTS, subjects)
        }
      })
    )
  },
  storeResults({ dispatch, commit }, subjects) {
    dispatch('storeWithRating', subjects).then(() =>
      commit(
        t.ADD_RESULTS,
        subjects
          .filter(({ scheme }) => scheme !== MARESI)
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
    return {
      jwt,
      kid: state.publicKey,
      payload,
      signature: jwt.split('.')[2]
    }
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
      path: 'search',
      query
    })
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
