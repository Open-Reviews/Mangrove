<template>
  <v-container>
    <v-card v-for="sub in subs" :key="sub.sub" active-class="event">
      <v-card-title>{{ sub.profile.title }}</v-card-title>
      <v-card-subtitle>{{ sub.sub }}</v-card-subtitle>
      <v-card-text>{{ sub.profile.description }}</v-card-text>
      <v-card-actions>
        <v-btn v-on:click="request(sub.sub)" text>
          Select
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
export default {
  computed: {
    subs() {
      return this.$store.state.subs
    }
  },
  methods: {
    request(sub) {
      this.$store.dispatch('saveReviews', { sub })
    }
  }
}
</script>
