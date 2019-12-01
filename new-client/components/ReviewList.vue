<template>
  <v-container>
    <span v-if="!reviews.length">No reviews found</span>
    <Review
      v-for="r in reviews"
      :key="r.signature"
      :review="r"
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
      return this.$store.state.selected
    },
    filters() {
      return this.$store.state.filters
    },
    reviews() {
      // TODO: Return generator to improve performance.
      return Object.values(this.$store.state.reviews).filter((review) => {
        // Pick only ones for selected subject.
        const isSelected =
          this.selected &&
          (this.selected.sub == null || review.sub === this.selected.sub)
        // Pick only mine when selected.
        const isMine = this.mine && review.iss === this.$store.state.publicKey
        const isFiltered =
          !this.filters.length ||
          this.filters.some((filter) => review.sub.startsWith(filter))
        return (isSelected || isMine) && isFiltered
      })
    }
  }
}
</script>
