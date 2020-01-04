import Vue from 'vue'
import { get, set } from 'idb-keyval'
import { MARESI, GEO } from '../store/scheme-types'
import * as t from './mutation-types'
const base64url = require('base64-url')
const cbor = require('cbor')

const clientUri = 'https://mangrove.reviews'

export const state = () => ({
  keyPair: null,
  publicKey: null,
  alphaWarning: true,
  isSearching: true,
  query: { q: null, geo: null },
  // Object from sub (URI) to subject info, see `middleware/search.js` for details.
  subjects: {},
  // Currently selected URI.
  selected: null,
  // Array of schemes that should be selected, empty means display all.
  filters: [],
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
  },
  [t.STOP_SEARCH](state) {
    state.isSearching = false
  },
  [t.SET_QUERY](state, query) {
    state.query = query
  },
  [t.ADD_SUBJECTS](state, newsubjects) {
    state.subjects = { ...state.subjects, ...newsubjects }
  },
  [t.EMPTY_SUBJECTS](state) {
    state.subjects = {}
  },
  [t.ADD_ISSUERS](state, newissuers) {
    state.issuers = { ...state.issuers, ...newissuers }
  },
  [t.SET_FILTERS](state, filters) {
    state.filters = filters
  },
  [t.ADD_REVIEWS](state, newreviews) {
    if (newreviews) {
      newreviews.map((review) =>
        Vue.set(state.reviews, review.signature, review)
      )
    }
  },
  [t.SET_META](state, [key, value]) {
    state.metadata[key] = value === '' ? null : value
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

export const actions = {
  savePublicKeys({ state, commit }, pubkey) {
    window.crypto.subtle
      .exportKey('raw', pubkey)
      .then((exported) =>
        commit(t.SET_PK, base64url.encode(new Uint8Array(exported)))
      )
  },
  async generateKeypair({ commit, dispatch }) {
    let keypair
    await get('keyPair')
      .then(async (kp) => {
        if (kp) {
          keypair = kp
          console.log('Loading existing keys from IndexDB:', keypair)
        } else {
          await window.crypto.subtle
            .generateKey(
              {
                name: 'ECDSA',
                namedCurve: 'P-256'
              },
              true,
              ['sign', 'verify']
            )
            .then((kp) => {
              keypair = kp
              return set('keyPair', keypair)
            })
            .catch((error) => console.log('Accessing IndexDB failed: ', error))
        }
      })
      .catch((error) => console.log('Accessing IndexDB failed: ', error))
    commit(t.SET_KEYPAIR, keypair)
    await dispatch('savePublicKeys', keypair.publicKey)
  },
  // Fetch reviews mathing params from the server.
  getReviews({ commit }, params) {
    return this.$axios
      .get(`${process.env.VUE_APP_API_URL}/reviews`, {
        params,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((response) => {
        commit(t.REQUEST_ERROR, null)
        return response.data
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
    // Geta and save in state the reviews and their issuers.
    dispatch('getReviews', params).then((rs) => {
      if (rs) {
        commit(t.ADD_REVIEWS, rs.reviews)
        commit(t.ADD_ISSUERS, rs.issuers)
        Object.keys(rs.maresi_subjects).map((maresi) => {
          rs.maresi_subjects[maresi].scheme = MARESI
        })
        commit(t.ADD_SUBJECTS, rs.maresi_subjects)
      }
    })
  },
  bulkSubjects({ commit }, subs) {
    return this.$axios
      .post(`${process.env.VUE_APP_API_URL}/batch`, { subs })
      .then((response) => {
        commit(t.REQUEST_ERROR, null)
        return response.data.subjects
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
  reviewContent({ state }, stubClaim) {
    // Assumes stubClaim contains at least `sub`
    // Add mandatory fields.
    const payload = {
      iss: state.publicKey,
      iat: Math.floor(Date.now() / 1000),
      sub: stubClaim.sub
    }
    // Add field only if it is not empty.
    if (stubClaim.rating != null) payload.rating = stubClaim.rating
    if (stubClaim.opinion) payload.opinion = stubClaim.opinion
    if (stubClaim.extra_hashes.length)
      payload.extra_hashes = stubClaim.extra_hashes
    const meta = { ...stubClaim.metadata, ...state.metadata }
    // Remove empty metadata fields.
    Object.keys(meta).forEach((key) => meta[key] == null && delete meta[key])
    meta.client_uri = clientUri
    // Always at least `client_uri` present.
    payload.metadata = meta
    console.log('payload: ', JSON.stringify(payload))
    const encoded = cbor.encode(payload)
    console.log('msg: ', base64url.encode(encoded))
    return window.crypto.subtle
      .sign(
        {
          name: 'ECDSA',
          hash: { name: 'SHA-256' }
        },
        state.keyPair.privateKey,
        encoded
      )
      .then((signed) => {
        console.log('sig: ', new Uint8Array(signed))
        return {
          signature: base64url.encode(new Uint8Array(signed)),
          encodedPayload: base64url.encode(encoded),
          payload
        }
      })
  },
  submitReview({ commit, dispatch }, reviewStub) {
    dispatch('reviewContent', reviewStub).then(
      ({ signature, encodedPayload, payload }) => {
        const review = { signature, payload: encodedPayload }
        console.log('Mangrove review: ', review)
        this.$axios
          .put(`${process.env.VUE_APP_API_URL}/submit`, review, {
            headers: {
              'Content-Type': 'application/cbor'
            }
          })
          .then(() => {
            commit(t.SUBMIT_ERROR, null)
            // Add review so that its immediately visible.
            commit(t.ADD_REVIEWS, [{ signature, payload }])
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
          })
      }
    )
  },
  // Adjust the route and save reviews for the given subject locally.
  selectSubject({ dispatch }, [query, sub]) {
    console.log('Selecting subject: ', sub)
    this.app.router.push({
      path: 'search',
      query: { sub, q: query.q, [GEO]: query.geo }
    })
    dispatch('saveReviews', { sub })
  },
  getIssuer({ state, commit }, pubkey) {
    return (
      state.issuers[pubkey] ||
      this.$axios
        .get(`${process.env.VUE_APP_API_URL}/issuer/${pubkey}`, {
          headers: {
            'Content-Type': 'application/cbor'
          }
        })
        .then(({ data }) => {
          commit(t.ADD_ISSUERS, [data])
          return data
        })
    )
  }
}
