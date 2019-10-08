import Vue from "vue";
import Vuex from "vuex";
import { get, set } from "idb-keyval";

Vue.use(Vuex);

const state = {
  keyPair: null,
  publicKey: null,
  idType: "URL",
  id: null,
  reviews: [],
  rating: null,
  opinion: null,
  showExtra: false,
  extraHashes: [],
  showMeta: false,
  meta: {},
  errors: { request: null, submit: null }
};

const mutations = {
  review(state, newreview) {
    state.reviews.push(newreview);
  },
  keypair(state, keypair) {
    state.keyPair = keypair;
  },
  publickey(state, key) {
    state.publicKey = key;
  },
  idtype(state, type) {
    state.idType = type;
  },
  id(state, currentid) {
    state.id = currentid;
  },
  reviews(state, list) {
    state.reviews = list;
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
  extraData(state, files) {
    state.extraData = files;
  },
  showmeta(state, bool) {
    state.showMeta = bool;
  },
  meta(state, [key, value]) {
    state.meta[key] = value;
  },
  requesterror(state, error) {
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
    commit("publickey", new Uint8Array(exported));
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
