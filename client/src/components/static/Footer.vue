<template>
  <div>
    <button v-on:click="goTo(c.FAQ)">FAQ</button> <br />
    <a :href="dumpUrl">Get all Mangrove data</a>
  </div>
</template>

<script>
import { SET_CONTENT } from "../../mutation-types.js";
import * as c from "../../content-types";

export default {
  data() {
    return {
      dumpUrl: `${process.env.VUE_APP_API_URL}/request`,
      c
    };
  },
  methods: {
    goTo(content) {
      this.$store.commit(SET_CONTENT, content);
    }
  }
};
</script>
