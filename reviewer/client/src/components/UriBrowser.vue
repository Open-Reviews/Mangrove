<template>
  <div v-if="uris[0]">
    <ul>
      <li v-for="object in uris" :key="object.uri">
        {{ object.uri }} {{ object.description }}
        <button v-on:click="request(object.uri)">
          Select
        </button>
        <span v-if="object.uri === $store.state.selectedUri"> selected </span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  computed: {
    uris: function() {
      return this.$store.state.uris;
    }
  },
  methods: {
    request(uri) {
      this.$store.dispatch("requestReviews", { uri });
    }
  }
};
</script>
