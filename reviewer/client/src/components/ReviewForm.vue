<template>
  <div>
    <span v-if="publicKey">
      Public key: {{ publicKey }} <br />
      <br />
    </span>
    Your review:
    <star-rating v-model="rating"></star-rating>
    <span v-if="!rating"> No rating, pick number of stars. </span>
    <br /><br />
    <input v-model="opinion" placeholder="your opinion" />
    <br /><br />
    <div v-if="$store.state.showExtra">
      <ExtraForm />
      <br /><br />
    </div>
    <div v-else>
      <button v-on:click="showExtra">Upload files</button>
      <br /><br />
    </div>
    <br /><br />
    <div v-if="$store.state.showMeta">
      <MetaForm />
      <br /><br />
    </div>
    <div v-else>
      <button v-on:click="showMeta">Enter additional information</button>
      <br /><br />
    </div>
    <button v-on:click="submitReview">Submit review</button>
    <br /><br />
    <div v-if="submitError">Error encountered: {{ submitError }}</div>
  </div>
</template>

<script>
import StarRating from "vue-star-rating";
var cbor = require("cbor");
import ExtraForm from "./ExtraForm.vue";
import MetaForm from "./MetaForm.vue";

export default {
  components: {
    StarRating,
    ExtraForm,
    MetaForm
  },
  computed: {
    publicKey: function() {
      var pk = this.$store.state.publicKey;
      if (pk) {
        return this.toHexString(pk);
      } else {
        return pk;
      }
    },
    rating: {
      get() {
        return this.$store.state.rating;
      },
      set(value) {
        this.$store.commit("rating", value);
      }
    },
    opinion: {
      get() {
        return this.$store.state.opinion;
      },
      set(value) {
        this.$store.commit("opinion", value);
      }
    },
    submitError: {
      get() {
        return this.$store.state.errors.submit;
      },
      set(e) {
        this.$store.commit("submiterror", e);
      }
    }
  },
  methods: {
    toHexString: function(byteArray) {
      return byteArray.reduce(
        (output, elem) => output + ("0" + elem.toString(16)).slice(-2),
        ""
      );
    },
    showExtra: function() {
      this.$store.commit("showextra", true);
    },
    showMeta: function() {
      this.$store.commit("showmeta", true);
    },
    submitReview: async function() {
      // Add mandatory fields.
      var claim = {
        version: 1,
        publickey: this.publicKey,
        timestamp: Math.floor(Date.now() / 1000),
        idtype: this.$store.state.idType,
        id: this.$store.state.id
      };
      // Add field only if it is not empty.
      if (this.rating) claim.rating = this.rating * 25 - 25;
      if (this.opinion) claim.opinion = this.opinion;
      if (this.$store.state.extraHashes[0])
        claim.extradata = this.$store.state.extraHashes;
      const meta = this.$store.state.meta;
      if (Object.entries(meta).length !== 0) claim.metadata = meta;
      console.log("claim: ", claim);
      var encoded = cbor.encode(claim);
      console.log("pk: ", this.$store.state.publicKey);
      console.log("msg: ", encoded);
      var signed = await window.crypto.subtle.sign(
        {
          name: "ECDSA",
          hash: { name: "SHA-256" }
        },
        this.$store.state.keyPair.privateKey,
        encoded
      );

      console.log("sig: ", new Uint8Array(signed));
      const review = {
        ...claim,
        signature: this.toHexString(new Uint8Array(signed))
      };

      console.log("Mangrove review: ", review);
      this.axios
        .put("http://localhost:8000/submit", review, {
          headers: {
            "Content-Type": "application/json"
          }
        })
        .then(() => {
          this.$store.commit("showextra", false);
          this.$store.commit("showmeta", false);
          this.submitError = null;
          this.$store.commit("review", review);
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
  }
};
</script>
