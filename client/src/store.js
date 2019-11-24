import Vue from "vue";
import Vuex from "vuex";
let cbor = require("cbor");
import { get, set } from "idb-keyval";
import * as t from "./mutation-types";
import { toHexString } from "./utils";

Vue.use(Vuex);

const state = {
  query: null,
  keyPair: null,
  publicKey: null,
  // Array of objects { sub: ..., scheme: ..., description: ... }
  subs: [],
  selectedUri: null,
  // Object from MaReSi to reviews, ensuring only unique ones are stored.
  reviews: {},
  rating: null,
  opinion: null,
  showExtra: false,
  extraHashes: [],
  showMeta: false,
  meta: {},
  errors: { import: null, search: null, request: null, submit: null }
};

const mutations = {
  [t.SET_KEYPAIR](state, keypair) {
    state.keyPair = keypair;
  },
  [t.SET_PK](state, key) {
    state.publicKey = key;
  },
  [t.QUERY](state, newquery) {
    state.query = newquery;
  },
  [t.ADD_URIS](state, newsubs) {
    state.subs.push(...newsubs);
  },
  [t.EMPTY_URIS](state) {
    state.subs = [];
  },
  [t.SELECT_URI](state, sub) {
    state.selectedUri = sub;
  },
  [t.ADD_REVIEWS](state, newreviews) {
    newreviews.map(r => Vue.set(state.reviews, r.signature, r));
    console.log("ADD_REVIEWS: ", state.reviews);
  },
  rating(state, stars) {
    state.rating = stars;
  },
  opinion(state, text) {
    state.opinion = text;
  },
  showextra(state, bool) {
    state.showExtra = bool;
  },
  extraHashes(state, files) {
    state.extraHashes = files;
  },
  showmeta(state, bool) {
    state.showMeta = bool;
  },
  [t.SET_META](state, [key, value]) {
    state.meta[key] = value === "" ? null : value;
  },
  [t.IMPORT_ERROR](state, error) {
    state.errors.import = error;
  },
  [t.SEARCH_ERROR](state, error) {
    state.errors.search = error;
  },
  [t.REQUEST_ERROR](state, error) {
    state.errors.request = error;
  },
  submiterror(state, error) {
    state.errors.submit = error;
  }
};

const actions = {
  setKeypair({ commit }, keypair) {
    commit(t.SET_KEYPAIR, keypair);
    window.crypto.subtle
      .exportKey("raw", keypair.publicKey)
      .then(exported =>
        commit(t.SET_PK, toHexString(new Uint8Array(exported)))
      );
  },
  async generateKeypair({ dispatch }) {
    let keypair;
    await get("keyPair")
      .then(async kp => {
        if (kp) {
          console.log("Loading existing keys from IndexDB:", keypair);
          keypair = kp;
        } else {
          await window.crypto.subtle
            .generateKey(
              {
                name: "ECDSA",
                namedCurve: "P-256"
              },
              true,
              ["sign", "verify"]
            )
            .then(kp => {
              keypair = kp;
              return set("keyPair", keypair);
            })
            .catch(error => console.log("Accessing IndexDB failed: ", error));
        }
      })
      .catch(error => console.log("Accessing IndexDB failed: ", error));
    dispatch("setKeypair", keypair);
  },
  requestReviews({ commit }, params) {
    commit(t.SELECT_URI, params.sub);
    // Get reviews and put them in the reviews field.
    Vue.prototype.axios
      .get(`${process.env.VUE_APP_API_URL}/request`, { params })
      .then(response => {
        console.log(response);
        commit(t.ADD_REVIEWS, response["data"]);
        commit(t.REQUEST_ERROR, null);
      })
      .catch(error => {
        if (error.response) {
          console.log(error.response.status);
          console.log(error.response.headers);
          commit(t.REQUEST_ERROR, error.response.data);
        } else if (error.request) {
          console.log(error.request);
          commit(t.REQUEST_ERROR, "Server not reachable.");
        } else {
          console.log("Client request processing error: ", error.message);
          commit(t.REQUEST_ERROR, "Internal client error, please report.");
        }
      });
  },
  async submitReview({ state, commit }, { sub, rating, opinion, extradata }) {
    // Add mandatory fields.
    let claim = {
      iss: state.publicKey,
      iat: Math.floor(Date.now() / 1000),
      sub
    };
    // Add field only if it is not empty.
    if (null !== rating) claim.rating = rating * 25 - 25;
    if (opinion) claim.opinion = opinion;
    if (extradata && extradata.length != 0)
      claim.extradata = extradata;
    let meta = state.meta;
    // Remove empty metadata fields.
    Object.keys(meta).forEach(key => meta[key] == null && delete meta[key]);
    if (Object.entries(meta).length !== 0) claim.metadata = meta;
    console.log("claim: ", claim);
    const encoded = cbor.encode(claim);
    console.log("msg: ", encoded);
    const signed = await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }
      },
      state.keyPair.privateKey,
      encoded
    );

    console.log("sig: ", new Uint8Array(signed));
    const review = {
      ...claim,
      signature: toHexString(new Uint8Array(signed))
    };

    console.log("Mangrove review: ", review);
    Vue.prototype.axios
      .put(`${process.env.VUE_APP_API_URL}/submit`, review, {
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(() => {
        commit("showextra", false);
        commit("showmeta", false);
        this.submitError = null;
        // Add review so that its immediately visible.
        commit(t.ADD_REVIEWS, [review]);
      })
      .catch(error => {
        if (error.response) {
          console.log(error.response.status);
          console.log(error.response.headers);
          this.submitError = error.response.data;
        } else if (error.request) {
          console.log(error.request);
          this.submitError = "Server not reachable.";
        } else {
          console.log("Client submission processing error: ", error.message);
          this.submitError = "Internal client error, please report.";
        }
      });
    }
};

const getters = {};

export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations,
  strict: true
});
