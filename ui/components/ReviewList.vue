<template>
  <div>
    <div
      v-if="noReviewsMessage"
      v-html="noReviewsMessage"
      class="text-center"
    />
    <v-carousel
      v-if="$vuetify.breakpoint.mdAndDown && query.opinionated"
      :show-arrows="false"
      hide-delimiter-background
      height="auto"
    >
      <v-carousel-item v-for="(arg, i) in reliable" :key="i">
        <Review
          :review="arg.review"
          :issuer="arg.issuer"
          :maresiSubject="arg.maresiSubject"
          :subjectTitle="arg.subjectTitle"
          dense
          class="mb-10"
        />
      </v-carousel-item>
    </v-carousel>
    <ReviewListBase
      :listArgs="reliable"
      :cols="cols"
      :dense="query.opinionated"
      :hideMetaTags="hideMetaTags"
      v-else
    />
    
    <v-row
      v-if="
        opinionless.ratings.length && !showOpinionless && !query.opinionated
      "
      justify="center"
    >
      <v-btn @click="showOpinionless = true" text
        >Show reviews without a description</v-btn
      >
    </v-row>
    <ReviewListBase
      v-if="showOpinionless"
      :listArgs="opinionless.ratings"
      :cols="cols"
    />

    <v-row
      v-if="unreliable.length && !showUnreliable && !query.opinionated"
      justify="center"
    >
      <v-btn @click="showUnreliable = true" text
        >Show less reliable reviews</v-btn
      >
    </v-row>
    <ReviewListBase v-if="showUnreliable" :listArgs="unreliable" :cols="cols" />

    <v-row v-if="showReactions && reactions.length > 0">
      <v-row align="end">
        <v-col>
          <h2 class="display-1 ml-3">Reactions</h2>
        </v-col>
        <v-col>
          <v-btn class="float-right">Show Reactions</v-btn>
        </v-col>
      </v-row>
      <v-container v-if="query.kid && opinionless">
      <span
        v-if="query.kid && flags"
      >
        flags: {{ flags.length }}
      </span>
      <span
        v-if="query.kid && confirmations"
      >
        confirmations: {{ confirmations.length }}
      </span>
      <span
        v-if="query.kid && likes"
      >
        likes: {{ likes.length }}
      </span>
    </v-container>
    </v-row>

    <v-row
      v-if="reviews.length && notMaresi && !query.opinionated"
      justify="center"
    >
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
import Review from './Review'

export default {
  name: 'ReviewList',
  components: {
    ReviewListBase,
    Review
  },
  props: {
    query: {
      type: Object,
      default: () => {
        return {
          kid: this.$store.state.publicKey
        }
      }
    },
    cols: {
      type: Number,
      default: () => 12
    },
    hideMetaTags: Boolean,
    showReactions: Boolean
  },
  data() {
    return {
      neutralityThreshold: 0.2,
      showOpinionless: false,
      showUnreliable: false
    }
  },
  computed: {
    reviews() {      
      return this.$store.getters.reviewsAndCounts(this.query).reviews
    },
    showReactions() {
      return [0, MARESI].indexOf(this.$store.state.filter || 0) >= 0
    },
    opinionated() {
      return this.reviews
        .filter(
          (r) =>
            r.payload.opinion &&
            (!this.query.opinionated ||
              (r.scheme !== MARESI && r.payload.sub !== 'https://example.com'))
        )
        .map(this.reviewToArg)
    },
    reliable() {
      return this.opinionated
        .filter(
          (a) =>
            (!a.issuer.neutrality && !this.query.opinionated) ||
            (a.issuer.neutrality &&
              a.issuer.neutrality >= this.neutralityThreshold)
        )
        .slice(0, this.query.limit)
    },
    unreliable() {
      return this.opinionated.filter(
        (a) =>
          a.issuer.neutrality && a.issuer.neutrality < this.neutralityThreshold
      )
    },
    opinionless() {
      let Flags = 0
      let Likes = 0
      let Confirmations = 0
      const ratings = this.reviews
        .filter(({ payload, scheme }) => {
          if (payload.rating === 0) {
            Flags++
          }
          if (payload.rating === 100) {
            payload.metadata[IS_PERSONAL_EXPERIENCE] ? Confirmations++ : Likes++
          }
          return !payload.opinion && this.notMaresi && scheme !== MARESI
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
    reactions() {
      return this.reviews.filter((review) => review.scheme === MARESI && !review.payload.opinion)
    },
    likes() {
      return this.reactions.filter((review) => review.payload.rating === 100 && !review.payload.metadata[IS_PERSONAL_EXPERIENCE]);
    },
    confirmations() {
      return this.reactions.filter((review) => review.payload.rating === 100 && review.payload.metadata[IS_PERSONAL_EXPERIENCE]);
    },
    flags() {
      return this.reactions.filter((review) => review.payload.rating === 0);
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
      } else if (this.query.opinionated) {
        return ``
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
      const subject = this.$store.getters.subject(sub)
      const start = this.isMine ? 'Your review' : 'Review'
      const name = subject
        ? [subject.title, subject.subtitle].filter(Boolean).join(', ')
        : `subject with indentifier ${sub}, more information is currently not available.`
      return sub.startsWith(MARESI) && subject ? subject.title : `${start} of ${name}`
    }
  }
}
</script>

<style scoped>
.v-btn--round .v-btn__content .v-icon {
  color: white !important;
}
</style>
