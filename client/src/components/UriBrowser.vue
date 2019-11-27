<template>
  <div v-if="subs[0]">
    <ul>
      <li v-for="object in subs" :key="object.sub">
        {{ object.sub }} {{ object.profile }}
        <button v-on:click="request(object.sub)">
          Select
        </button>
        <span v-if="object.sub === $store.state.selectedUri"> selected </span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  computed: {
    subs: function() {
      return this.$store.state.subs;
    }
  },
  methods: {
    request(sub) {
      this.$store.dispatch("saveReviews", { sub });
    }
  }
};
</script>
