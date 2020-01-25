<template>
  <div>
    <div v-if="noReviewsMessage" class="text-center">
      {{ noReviewsMessage }}
    </div>
    <ReviewListBase :listArgs="opinionated" />
    <v-row
      v-if="opinionless.length && !showOpinionless && notMaresi"
      justify="center"
    >
      <span @click="showOpinionless = true" style="cursor: pointer"
        >Show reviews without a description</span
      >
    </v-row>
    <ReviewListBase v-if="showOpinionless" :listArgs="opinionless" />
    <v-row v-if="reviews.length && notMaresi" justify="center">
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-btn
            :href="download"
            :download="downloadName"
            v-on="on"
            class="my-7"
            color="success"
            >Download</v-btn
          >
        </template>
        Download the reviews in this list
      </v-tooltip>
    </v-row>
  </div>
</template>

<script>
import { downloadLink, pkDisplay } from '../utils'
import { MARESI } from '../store/scheme-types'
import ReviewListBase from './ReviewListBase'

export default {
  name: 'ReviewList',
  components: {
    ReviewListBase
  },
  props: {
    rootSub: String,
    rootIss: {
      type: String,
      default: () => ''
    }
  },
  data() {
    return {
      showOpinionless: false
    }
  },
  computed: {
    filters() {
      return this.$store.state.filters
    },
    reviews() {
      // TODO: Return generator to improve performance.
      return Object.values(this.$store.state.reviews)
        .filter(({ payload }) => {
          // Pick only ones for selected subject or issuer.
          const isSelected = payload.sub === this.rootSub
          const isFiltered =
            payload.iss === this.rootIss &&
            !payload.sub.startsWith(MARESI) &&
            (!this.filters.length ||
              this.filters.some((filter) => payload.sub.startsWith(filter)))
          return isSelected || isFiltered
        })
        .sort((r1, r2) => r2.payload.iat - r1.payload.iat)
    },
    opinionated() {
      return this.reviews.filter((r) => r.payload.opinion).map(this.reviewToArg)
    },
    opinionless() {
      return this.reviews
        .filter((r) => !r.payload.opinion)
        .map(this.reviewToArg)
    },
    notMaresi() {
      return (
        !this.$store.state.isSearching &&
        (!this.rootSub || !this.rootSub.startsWith(MARESI))
      )
    },
    download() {
      return this.notMaresi && downloadLink(this.reviews)
    },
    downloadName() {
      return `mangrove.reviews_${this.rootSub || pkDisplay(this.rootIss)}.json`
    },
    noReviewsMessage() {
      if (!this.download || this.reviews.length) {
        return null
      } else if (this.rootSub) {
        return 'Be the first to review!'
      } else {
        return 'No reviews yet'
      }
    }
  },
  methods: {
    reviewToArg(review) {
      return {
        review,
        issuer: this.$store.getters.issuer(review.payload.iss),
        maresiSubject: this.$store.getters.subject(
          `${MARESI}:${review.signature}`
        ),
        subjectTitle: this.subjectTitle(review.payload.sub),
        rootSub: `${MARESI}:${review.signature}`
      }
    },
    subjectTitle(sub) {
      if (!this.rootIss) {
        return
      }
      const subject = this.$store.getters.subject(sub)
      return subject && `${subject.title}, ${subject.subtitle}`
    }
  }
}
</script>
