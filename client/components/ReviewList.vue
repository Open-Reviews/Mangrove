<template>
  <v-container>
    <span v-if="!reviews.length">No reviews found</span>
    <Review
      v-for="r in reviews"
      :key="r.signature"
      :review="r"
      :issuer="issuer(r.iss)"
      :subject="subject(r.signature)"
      :preview="mine"
    />
  </v-container>
</template>

<script>
import Review from './Review'

export default {
  components: {
    Review
  },
  props: {
    mine: Boolean
  },
  computed: {
    selected() {
      return this.$route.query.sub
    },
    filters() {
      return this.$store.state.filters
    },
    reviews() {
      // TODO: Return generator to improve performance.
      return Object.values(this.$store.state.reviews).filter((review) => {
        // Pick only ones for selected subject.
        const isSelected = this.selected == null || review.sub === this.selected
        // Pick only mine when selected.
        const isMine = this.mine && review.iss === this.$store.state.publicKey
        const isFiltered =
          !this.filters.length ||
          this.filters.some((filter) => review.sub.startsWith(filter))
        return (isSelected || isMine) && isFiltered
      })
    }
  },
  methods: {
    issuer(iss) {
      return { count: 2 }
    },
    subject(maresi) {
      return {
        quality: 3,
        count: 5,
        positive_count: 2,
        confirmed_count: 1
      }
    }
  }
}
</script>
