<template>
  <div>
    <div v-if="$store.state.publicKey">
      Your public key: {{ $store.state.publicKey }} <br />
      <form v-on:submit.prevent>
        <span v-if="showSecret">
          <input required v-model="secret" :type="secretFieldType" autocomplete="current-password" />
        </span>
        <span v-else>
          <input v-model="secret" />
          <button v-on:click="importSecret">Import existing secret.</button>
        </span>
        <hr/>
        <input type="checkbox" id="mine" v-model="showSecret" v-on:change="exportSecret"/>
        <label for="mine">Show my secret key to save it.</label>
      </form>
      <br />
      <button v-on:click="getMyReviews">Show my reviews</button>
      <br />
    </div>
  </div>
</template>

<script>
// <input type="checkbox" id="mine" v-model="showSecret" onChange="this.form.submit()" />
import { EMPTY_URIS, IMPORT_ERROR } from "../mutation-types";

export default {
  data: function() {
    return {
      showSecret: false,
      secret: null
    };
  },
  computed: {
    secretFieldType: function() { return this.showSecret ? "text" : "password"; }
  },
  methods: {
    exportSecret() {
      crypto.subtle.exportKey("jwk", this.$store.state.keyPair.privateKey)
        .then(s => {
          s.metadata = "Your Mangrove secret key."
          this.secret = JSON.stringify(s);
        });
    },
    async importSecret() {
      let jwk = JSON.parse(this.secret);
      const sk = await crypto.subtle.importKey("jwk", jwk, {
                name: "ECDSA",
                namedCurve: "P-256"
              }, true, ["sign"])
              .catch(error => this.$store.commit(IMPORT_ERROR, error));
      delete jwk.d;
      delete jwk.dp;
      delete jwk.dq;
      delete jwk.q;
      delete jwk.qi;
      jwk.key_ops = ["verify"];
      const pk = await crypto.subtle.importKey("jwk", jwk, {
                name: "ECDSA",
                namedCurve: "P-256"
              }, true, ["verify"])
              .catch(error => this.$store.commit(IMPORT_ERROR, error));
      this.$store.dispatch("setKeypair", { privateKey: sk, publicKey: pk });
    },
    getMyReviews() {
      this.$store.commit(EMPTY_URIS);
      this.$store.dispatch("requestReviews", {
        publickey: this.$store.state.publicKey
      });
    }
  }
};
</script>
