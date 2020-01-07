<template>
  <v-container>
    <div v-if="download && !reviews.length" class="text-center">
      Be the first to review!
    </div>
    <div v-for="r in reviews" :key="r.signature">
      <Review
        :review="r"
        :issuer="issuers[r.payload.iss]"
        :subject="subject(r.signature)"
        :preview="mine"
        class="my-2"
      />
      <ReviewList :rootUri="maresi(r.signature)" class="ml-2 mt-5" />
    </div>
    <v-row v-if="download" justify="center">
      <v-btn :href="download" download="data.json" class="my-5"
        >Download reviews above</v-btn
      >
    </v-row>
  </v-container>
</template>

<script>
import { downloadLink } from '../utils'
import { MARESI } from '../store/scheme-types'
import Review from './Review'

export default {
  name: 'ReviewList',
  components: {
    Review
  },
  props: {
    rootUri: String,
    mine: Boolean
  },
  computed: {
    filters() {
      return this.$store.state.filters
    },
    reviews() {
      // TODO: Return generator to improve performance.
      return Object.values(this.$store.state.reviews).filter(({ payload }) => {
        // Pick only ones for selected subject.
        const isSelected = this.rootUri == null || payload.sub === this.rootUri
        // Pick only mine when selected.
        const isMine = this.mine && payload.iss === this.$store.state.publicKey
        const isFiltered =
          !this.filters.length ||
          this.filters.some((filter) => payload.sub.startsWith(filter))
        return (isSelected || isMine) && isFiltered
      })
    },
    issuers() {
      return this.$store.state.issuers
    },
    download() {
      return (
        !this.$store.state.isSearching &&
        !this.rootUri.startsWith(MARESI) &&
        downloadLink(this.reviews)
      )
    }
  },
  methods: {
    maresi(signature) {
      return `${MARESI}:${signature}`
    },
    subject(signature) {
      const ret = this.$store.state.subjects[this.maresi(signature)]
      console.log(ret, this.maresi(signature))
      return ret
    }
  }
}
</script>
