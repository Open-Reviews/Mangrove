<template>
  <div>
    <span v-if="$store.state.publicKey">
      Your public key: {{ $store.state.publicKey }} <br />
      <br />
      <button v-on:click="getMyReviews">Show my reviews</button>
      <br />
    </span>
  </div>
</template>

<script>
import { EMPTY_URIS } from "../mutation-types";

export default {
  computed: {
    uris: function() {
      return this.$store.state.uris;
    }
  },
  methods: {
    getMyReviews() {
      this.$store.commit(EMPTY_URIS);
      this.$store.dispatch("requestReviews", { publickey: this.$store.state.publicKey });
    }
  }
};
</script>

