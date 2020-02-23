<template>
  <div>
    <div
      v-if="noReviewsMessage"
      v-html="noReviewsMessage"
      class="text-center"
    />
    <ReviewListBase :listArgs="opinionated" />
    <v-container v-if="query.kid && opinionless">
      <span
        v-if="query.kid && v !== 0"
        v-for="[k, v] in Object.entries(opinionless.other)"
      >
        {{ k }}: {{ v }}
      </span>
    </v-container>
    <v-row
      v-if="opinionless.ratings.length && !showOpinionless"
      justify="center"
    >
      <span @click="showOpinionless = true" style="cursor: pointer"
        >Show reviews without a description</span
      >
    </v-row>
    <ReviewListBase v-if="showOpinionless" :listArgs="opinionless.ratings" />

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
import { downloadLink, pemDisplay, displayName } from '../utils'
import { MARESI, subPath } from '../store/scheme-types'
import { IS_PERSONAL_EXPERIENCE } from '../store/metadata-types'
import ReviewListBase from './ReviewListBase'

export default {
  name: 'ReviewList',
  components: {
    ReviewListBase
  },
  props: {
    query: {
      type: Object,
      default: () => {
        return {
          kid: this.$store.state.publicKey
        }
      }
    }
  },
  data() {
    return {
      showOpinionless: false
    }
  },
  computed: {
    reviews() {
      return this.$store.getters.reviewsAndCounts(this.query).reviews
    },
    opinionated() {
      return this.reviews.filter((r) => r.payload.opinion).map(this.reviewToArg)
    },
    opinionless() {
      let Flags = 0
      let Likes = 0
      let Confirmations = 0
      const ratings = this.reviews
        .filter(({ payload }) => {
          if (payload.rating === 0) {
            Flags++
          }
          if (payload.rating === 100) {
            payload.metadata[IS_PERSONAL_EXPERIENCE] ? Confirmations++ : Likes++
          }
          return !payload.opinion
        })
        .map(this.reviewToArg)
      return { ratings, other: { Flags, Likes, Confirmations } }
    },
    notMaresi() {
      return (
        !this.$store.state.isSearching &&
        (!this.query.sub || !this.query.sub.startsWith(MARESI))
      )
    },
    download() {
      return this.notMaresi && downloadLink(this.reviews)
    },
    downloadName() {
      const name =
        this.query.sub ||
        (this.query.kid && pemDisplay(this.query.kid)) ||
        (Object.keys(this.query).length === 0 && '') ||
        JSON.stringify(this.query)
      return `mangrove.reviews_${name}.json`
    },
    noReviewsMessage() {
      if (!this.download || this.reviews.length) {
        return null
      } else if (this.query.sub) {
        return 'Be the first to review!'
      } else if (this.isMine) {
        return `No reviews yet. <a href="${process.env.BASE_URL}">Leave your first review</a>`
      } else {
        return `This user has not left any reviews.`
      }
    },
    isMine() {
      return this.query.kid === this.$store.state.publicKey
    }
  },
  methods: {
    reviewToArg(review) {
      return {
        review,
        issuer: this.$store.getters.issuer(review.kid),
        maresiSubject: this.$store.getters.subject(
          `${MARESI}:${review.signature}`
        ),
        subjectTitle: this.subjectTitle(review.payload),
        rootSub: `${MARESI}:${review.signature}`
      }
    },
    subjectTitle({ sub, metadata }) {
      if (this.query.sub) {
        return
      }
      if (sub.startsWith(MARESI)) {
        const originalReview = this.$store.state.reviews[subPath(MARESI, sub)]
        if (originalReview && originalReview.payload.metadata) {
          const start = this.isMine ? 'Your comment' : 'Comment'
          return `${start} on ${displayName(
            originalReview.payload.metadata
          )}'s review`
        }
      } else {
        const subject = this.$store.getters.subject(sub)
        const start = this.isMine ? 'Your review' : 'Review'
        const name = subject
          ? [subject.title, subject.subtitle].filter(Boolean).join(', ')
          : `subject with indentifier ${sub}, more information is currently not available.`
        return `${start} of ${name}`
      }
    }
  }
}
</script>
