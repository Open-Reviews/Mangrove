import Vue from 'vue'
import { get, set } from 'idb-keyval'
import { MARESI, GEO, subToScheme } from './scheme-types'
import { subsToSubjects } from './apis'
import { PRIVATE_KEY } from './indexeddb-types'
import * as t from './mutation-types'
import { CLIENT_ID } from './metadata-types'
import { jwkToKeypair, skToJwk, keyToPem } from '~/utils'
const base64url = require('base64-url')
const jwt = require('jsonwebtoken')
const cbor = require('borc')

export const state = () => ({
  keyPair: null,
  publicKey: null,
  alphaWarning: true,
  isSearching: false,
  query: { q: null, geo: null },
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

export const getters = {
  subject: (state) => (sub) => {
    return state.subjects[sub] || console.log('not present in subjects', sub)
  },
  issuer: (state) => (iss) => {
    return state.issuers[iss] || console.log('not present in issuers', iss)
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
  }
}

export const actions = {
  setKeypair({ commit }, keypair) {
    commit(t.SET_KEYPAIR, keypair)
    skToJwk(keypair.privateKey).then((jwk) => set(PRIVATE_KEY, jwk))
    window.crypto.subtle
      .exportKey('raw', keypair.publicKey)
      .then((exported) =>
        commit(t.SET_PK, base64url.encode(new Uint8Array(exported)))
      )
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
            console.log('Loading existing keys from IndexDB:', keypair)
            return
          } catch (e) {
            console.log('Bad key in IndexDB:', jwk)
          }
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
            })
            .catch((error) => console.log('Accessing IndexDB failed: ', error))
        }
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
            skToJwk(kp.privateKey).then((jwk) => set(PRIVATE_KEY, jwk))
          })
          .catch((error) => console.log('Accessing IndexDB failed: ', error))
      })
      .catch((error) => console.log('Accessing IndexDB failed: ', error))
    await dispatch('setKeypair', keypair)
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
  async saveMyReviews({ state, dispatch }) {
    const subs = await dispatch('saveReviews', {
      iss: state.publicKey
    }).then((rs) =>
      Object.values(rs.reviews).map((review) => review.payload.sub)
    )
    return Promise.all(
      subsToSubjects(this.$axios, subs).map((promise) =>
        promise.then((subject) => dispatch('storeWithRating', [subject]))
      )
    )
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
  storeWithRating({ commit, dispatch }, rawSubjects) {
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
  },
  async reviewContent({ state }, stubClaim) {
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
    if (stubClaim.extra_hashes && stubClaim.extra_hashes.length)
      payload.extra_hashes = stubClaim.extra_hashes
    const meta = { ...stubClaim.metadata, ...state.metadata }
    // Remove empty metadata fields.
    Object.keys(meta).forEach((key) => meta[key] == null && delete meta[key])
    // Always at least `client_id` present.
    meta[CLIENT_ID] = process.env.BASE_URL
    payload.metadata = meta
    console.log('payload: ', JSON.stringify(payload))
    const encoded = cbor.encode(payload)
    console.log('msg: ', base64url.encode(encoded))
    const signed = await window.crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      state.keyPair.privateKey,
      encoded
    )
    console.log('sig: ', new Uint8Array(signed))
    const privateJwk = await crypto.subtle.exportKey(
      'jwk',
      state.keyPair.publicKey
    )
    privateJwk.kid = state.publicKey
    privateJwk.alg = 'ES256'
    console.log('privateJwk: ', privateJwk)
    return {
      jwt: jwt.sign(payload, await keyToPem(state.keyPair.privateKey), {
        algorithm: 'ES256',
        header: {
          jwk: JSON.stringify(privateJwk),
          kid: state.publicKey
        }
      }),
      signature: base64url.encode(new Uint8Array(signed)),
      encodedPayload: base64url.encode(encoded),
      payload
    }
  },
  submitReview({ getters, commit, dispatch }, reviewStub) {
    return dispatch('reviewContent', reviewStub).then(
      ({ jwt, signature, encodedPayload, payload }) => {
        if (!getters.isUnique(payload)) {
          commit(t.SUBMIT_ERROR, 'You have already submitted this review.')
          return false
        }
        console.log('jwt: ', jwt)
        const review = { signature, payload }
        console.log('Mangrove review: ', review)
        return this.$axios
          .put(`${process.env.VUE_APP_API_URL}/submit`, jwt, {
            headers: {
              'Content-Type': 'application/jwt'
            }
          })
          .then(() => {
            commit(t.SUBMIT_ERROR, null)
            // Add review so that its immediately visible.
            return dispatch('getSubject', `${MARESI}:${signature}`)
          })
          .then(() => {
            commit(t.ADD_REVIEWS, [{ signature, payload }])
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
      }
    )
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
      this.$axios
        .get(`${process.env.VUE_APP_API_URL}/issuer/${pubkey}`)
        .then(({ data }) => {
          commit(t.ADD_ISSUERS, { [pubkey]: data })
          return data
        })
    )
  },
  getSubject({ commit }, subject) {
    return this.$axios
      .get(`${process.env.VUE_APP_API_URL}/subject/${subject}`)
      .then(({ data }) => {
        data.scheme = subToScheme(data.sub)
        commit(t.ADD_SUBJECTS, { [data.sub]: data })
        return data
      })
  }
}
