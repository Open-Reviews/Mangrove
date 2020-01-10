<template>
  <v-container>
    <div v-if="download && !reviews.length" class="text-center">
      Be the first to review!
    </div>
    <div v-for="(arg, i) in listArgs" :key="i">
      <Review
        :review="arg.review"
        :issuer="arg.issuer"
        :maresiSubject="arg.maresiSubject"
        :subjectTitle="arg.subjectTitle"
        class="my-2"
      />
      <ReviewList :rootSub="arg.rootSub" class="ml-2 mt-5" />
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
    rootSub: String,
    rootIss: {
      type: String,
      default: () => ''
    }
  },
  computed: {
    filters() {
      return this.$store.state.filters
    },
    reviews() {
      // TODO: Return generator to improve performance.
      return Object.values(this.$store.state.reviews).filter(({ payload }) => {
        // Pick only ones for selected subject or issuer.
        const isSelected =
          payload.sub === this.rootSub ||
          (payload.iss === this.rootIss && !payload.sub.startsWith(MARESI))
        const isFiltered =
          !this.filters.length ||
          this.filters.some((filter) => payload.sub.startsWith(filter))
        return isSelected && isFiltered
      })
    },
    listArgs() {
      return this.reviews.map((r) => {
        return {
          review: r,
          issuer: this.$store.state.issuers[r.payload.iss],
          maresiSubject: this.maresiSubject(r.signature),
          subjectTitle: this.subjectTitle(r.payload.sub),
          rootSub: this.maresi(r.signature)
        }
      })
    },
    download() {
      return (
        !this.$store.state.isSearching &&
        (!this.rootSub || !this.rootSub.startsWith(MARESI)) &&
        downloadLink(this.reviews)
      )
    }
  },
  methods: {
    maresi(signature) {
      return `${MARESI}:${signature}`
    },
    maresiSubject(signature) {
      return this.$store.getters.subject(this.maresi(signature))
    },
    subjectTitle(sub) {
      if (this.rootIss) {
        const subject = this.$store.getters.subject(sub)
        return subject ? `${subject.title}, ${subject.subtitle}` : ''
      } else {
        return ''
      }
    }
  }
}
</script>
