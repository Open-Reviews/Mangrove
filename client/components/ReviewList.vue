<template>
  <v-container>
    <span v-if="!reviews.length">No reviews found</span>
    <Review
      v-for="r in reviews"
      :key="r.signature"
      :review="r"
      :issuer="issuers[r.iss]"
      :subject="subjects[`urn:maresi:${r.signature}`]"
      :preview="mine"
    />
    <v-row justify="center">
      <v-btn v-if="mine" :href="download" download="data.json" class="my-5"
        >Download reviews</v-btn
      >
    </v-row>
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
        console.log('isSelected ', isSelected, ' isFiltered ', isFiltered)
        return (isSelected || isMine) && isFiltered
      })
    },
    issuers() {
      return this.$store.state.issuers
    },
    subjects() {
      return this.$store.state.subjects
    },
    download() {
      return (
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(this.reviews))
      )
    }
  }
}
</script>
