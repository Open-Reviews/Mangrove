<template>
  <v-container v-if="selected">
    <input id="mine" v-model="onlyMine" type="checkbox" />
    <label for="mine">Show only mine</label>
    <br />
    Showing reviews of {{ selected.profile.title }}
    <Review v-for="r in reviews" :key="r.signature" review="r" />
    <br />
  </v-container>
</template>

<script>
import Review from './Review'

export default {
  components: {
    Review
  },
  data() {
    return {
      onlyMine: false
    }
  },
  computed: {
    selected() {
      return this.$store.state.selected
    },
    reviews() {
      // TODO: Return generator to improve performance.
      return Object.values(this.$store.state.reviews).filter(
        (review) =>
          (this.selected ||
            this.selected.sub == null ||
            review.sub === this.selected.sub) &&
          (!this.onlyMine || review.iss === this.$store.state.publicKey)
      )
    }
  }
}
</script>
