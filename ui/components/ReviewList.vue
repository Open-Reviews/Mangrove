<template>
  <div>
    <div
      v-if="noReviewsMessage"
      v-html="noReviewsMessage"
      class="text-center"
    />
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
            >Download</v-btn
          >
        </template>
        Download all reviews in this list
      </v-tooltip>
    </v-row>
  </div>
</template>

<script>
import { downloadLink, pkDisplay, displayName } from '../utils'
import { MARESI, subPath } from '../store/scheme-types'
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
    reviews() {
      // TODO: Return generator to improve performance.
      return Object.values(this.$store.state.reviews)
        .filter(({ payload }) => {
          // Pick only ones for selected subject or issuer.
          const isSelected =
            payload.sub === this.rootSub || payload.iss === this.rootIss
          const isFiltered =
            !this.$store.state.filter ||
            payload.sub.startsWith(this.$store.state.filter)
          return isSelected && isFiltered
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
        return `No reviews yet. <a href="${process.env.BASE_URL}">Leave your first review</a>`
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
        subjectTitle: this.subjectTitle(review.payload),
        rootSub: `${MARESI}:${review.signature}`
      }
    },
    subjectTitle({ sub, metadata }) {
      if (!this.rootIss) {
        return
      }
      if (sub.startsWith(MARESI)) {
        const originalReview = this.$store.state.reviews[subPath(MARESI, sub)]
        if (originalReview && originalReview.payload.metadata) {
          return `Your comment on ${displayName(
            originalReview.payload.metadata
          )}'s review`
        }
      } else {
        const subject = this.$store.getters.subject(sub)
        return subject && `Your review of ${subject.title}, ${subject.subtitle}`
      }
    }
  }
}
</script>
