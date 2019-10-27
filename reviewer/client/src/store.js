import Vue from "vue";
import Vuex from "vuex";
import { get, set } from "idb-keyval";
import * as t from "./mutation-types";
import { toHexString } from "./utils";

Vue.use(Vuex);

const state = {
  query: null,
  keyPair: null,
  publicKey: null,
  // Array of objects { uri: ..., scheme: ..., description: ... }
  uris: [],
  selectedUri: null,
  reviews: [],
  rating: null,
  opinion: null,
  showExtra: false,
  extraHashes: [],
  showMeta: false,
  meta: {},
  errors: { search: null, request: null, submit: null }
};

const mutations = {
  [t.SET_PK](state, key) {
    state.publicKey = key;
  },
  [t.QUERY](state, newquery) {
    state.query = newquery;
  },
  [t.ADD_URIS](state, newuris) {
    state.uris.push(...newuris);
  },
  [t.EMPTY_URIS](state) {
    console.log("Clearing reviews.");
    state.uris = [];
  },
  [t.SELECT_URI](state, uri) {
    state.selectedUri = uri;
  },
  [t.SET_REVIEWS](state, newreviews) {
    state.reviews = newreviews;
  },
  keypair(state, keypair) {
    state.keyPair = keypair;
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
  meta(state, [key, value]) {
    state.meta[key] = value;
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
  async generateKeypair({ commit, state }) {
    var keypair;
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
    commit("keypair", keypair);
    const exported = await window.crypto.subtle.exportKey(
      "raw",
      state.keyPair.publicKey
    );
    commit(t.SET_PK, toHexString(new Uint8Array(exported)));
  },
  requestReviews({ commit }, params) {
    commit(t.SELECT_URI, params.uri);
    // Get reviews and put them in the reviews field.
    Vue.prototype.axios
      .get("http://localhost:8000/request", { params })
      .then(response => {
        console.log(response);
        commit(t.SET_REVIEWS, response["data"]);
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
