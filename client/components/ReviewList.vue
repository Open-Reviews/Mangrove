<template>
  <v-container>
    <span v-if="$store.state.isSearching">Results loading...</span>
    <span v-else-if="!reviews.length">No reviews found</span>
    <Review
      v-for="r in reviews"
      :key="r.signature"
      :review="r"
      :issuer="issuers[r.payload.iss]"
      :subject="subject(r.signature)"
      :preview="mine"
      class="my-2"
    />
    <v-row justify="center">
      <v-btn v-if="mine" :href="download" download="data.json" class="my-5"
        >Download reviews</v-btn
      >
    </v-row>
  </v-container>
</template>

<script>
import { downloadLink } from '../utils'
import { MARESI } from '../store/scheme-types'
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
      return Object.values(this.$store.state.reviews).filter(({ payload }) => {
        // Pick only ones for selected subject.
        const isSelected =
          this.selected == null || payload.sub === this.selected
        // Pick only mine when selected.
        const isMine = this.mine && payload.iss === this.$store.state.publicKey
        const isFiltered =
          !this.filters.length ||
          this.filters.some((filter) => payload.sub.startsWith(filter))
        console.log('isSelected ', isSelected, ' isFiltered ', isFiltered)
        return (isSelected || isMine) && isFiltered
      })
    },
    issuers() {
      return this.$store.state.issuers
    },
    download() {
      return downloadLink(this.reviews)
    }
  },
  methods: {
    subject(signature) {
      return this.$store.state.subjects[`${MARESI}:${signature}`]
    }
  }
}
</script>
