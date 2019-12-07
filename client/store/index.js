import Vue from 'vue'
import { get, set } from 'idb-keyval'
import { toHexString } from '../utils'
import * as t from './mutation-types'
const cbor = require('cbor')

const clientUri = 'https://mangrove.reviews'

export const state = () => ({
  keyPair: null,
  publicKey: null,
  alphaWarning: true,
  // Array of objects { sub: ..., scheme: ..., title: ..., description: ... }
  subjects: [],
  // Subject object that has been selected.
  selected: null,
  // Array of schemes that should be selected, empty means display all.
  filters: [],
  // Object from MaReSi to reviews, ensuring only unique ones are stored.
  reviews: {},
  rating: null,
  opinion: null,
  extraHashes: [],
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
  [t.ADD_SUBJECTS](state, newsubjects) {
    state.subjects.push(...newsubjects)
  },
  [t.EMPTY_SUBJECTS](state) {
    state.subjects = []
  },
  [t.SELECT_SUB](state, sub) {
    state.selected = sub
  },
  [t.SET_FILTERS](state, filters) {
    state.filters = filters
  },
  [t.ADD_REVIEWS](state, newreviews) {
    if (newreviews) {
      newreviews.map((r) => Vue.set(state.reviews, r.signature, r))
    }
  },
  extraHashes(state, files) {
    state.extraHashes = files
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
  submiterror(state, error) {
    state.errors.submit = error
  }
}

export const actions = {
  setKeypair({ commit }, keypair) {
    commit(t.SET_KEYPAIR, keypair)
    window.crypto.subtle
      .exportKey('raw', keypair.publicKey)
      .then((exported) =>
        commit(t.SET_PK, toHexString(new Uint8Array(exported)))
      )
  },
  async generateKeypair({ dispatch }) {
    let keypair
    await get('keyPair')
      .then(async (kp) => {
        if (kp) {
          console.log('Loading existing keys from IndexDB:', keypair)
          keypair = kp
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
    dispatch('setKeypair', keypair)
  },
  requestReviews({ commit }, params) {
    // Get reviews and put them in the reviews field.
    return this.$axios
      .get(`${process.env.VUE_APP_API_URL}/request`, { params })
      .then((response) => {
        console.log(response)
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
  saveReviews({ commit, dispatch }, params) {
    dispatch('requestReviews', params).then((rs) => commit(t.ADD_REVIEWS, rs))
  },
  reviewContent({ state }, stubClaim) {
    // Assumes stubClaim contains at least `sub`
    // Add other mandatory fields.
    const claim = {
      iss: state.publicKey,
      iat: Math.floor(Date.now() / 1000)
    }
    // Add field only if it is not empty.
    if (stubClaim.rating !== null) claim.rating = this.rating * 25 - 25
    if (stubClaim.opinion) claim.opinion = this.opinion
    const extraHashes = state.extraHashes
    if (extraHashes && extraHashes.length !== 0)
      claim.extra_hashes = extraHashes
    const meta = state.metadata
    // Remove empty metadata fields.
    Object.keys(meta).forEach((key) => meta[key] == null && delete meta[key])
    meta.client_uri = clientUri
    // Always at least `client_uri` present.
    claim.metadata = meta
    console.log('claim: ', claim)
    const encoded = cbor.encode(claim)
    console.log('msg: ', encoded)
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
          ...claim,
          signature: toHexString(new Uint8Array(signed))
        }
      })
  },
  submitReview({ commit, dispatch }, reviewStub) {
    dispatch('reviewContent', reviewStub).then((review) => {
      console.log('Mangrove review: ', review)
      this.$axios
        .put(`${process.env.VUE_APP_API_URL}/submit`, review, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then(() => {
          this.submitError = null
          // Add review so that its immediately visible.
          commit(t.ADD_REVIEWS, [review])
        })
        .catch((error) => {
          if (error.response) {
            console.log(error.response.status)
            console.log(error.response.headers)
            this.submitError = error.response.data
          } else if (error.request) {
            console.log(error.request)
            this.submitError = 'Server not reachable.'
          } else {
            console.log('Client submission processing error: ', error.message)
            this.submitError = 'Internal client error, please report.'
          }
        })
    })
  }
}
