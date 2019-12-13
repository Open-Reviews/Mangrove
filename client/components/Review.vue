<template>
  <v-card>
    <v-list-item>
      <v-list-item-avatar>
        <Identicon :seed="review.iss" />
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title class="headline">{{
          (review.metadata && review.metadata.display_name) || 'Anonymous'
        }}</v-list-item-title>
        <v-list-item-subtitle>{{ issuer.count }} reviews </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-card-text>
      <v-row align="center">
        <v-rating :value="(review.rating + 25) / 25" dense></v-rating>
        Reviewed {{ new Date(review.iat * 1000).toDateString() }}
      </v-row>
      {{ review.opinion }}
      <v-container v-if="review.extra_hashes">
        <v-carousel v-if="review.extra_hashes.length > 1">
          <v-carousel-item v-for="hash in review.extra_hashes" :key="hash">
            <v-img :src="imageUrl(hash)" />
          </v-carousel-item>
        </v-carousel>
        <v-img v-else :src="imageUrl(review.extra_hashes[0])" />
      </v-container>
      {{ review.metadata }}
    </v-card-text>
    <v-card-actions v-if="!preview">
      <v-tooltip v-for="action in actions" :key="action.icon" top>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" @click="action.action(review.signature)" icon>
            <v-icon>{{ action.icon }}</v-icon>
            {{ action.number }}
          </v-btn>
        </template>
        <span>{{ action.tooltip }}</span>
      </v-tooltip>
      <v-spacer />
      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" icon>
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="item in menu"
            :key="item.title"
            @click.stop="item.action(review)"
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-dialog
          :value="rawDialog"
          @click:outside="rawDialog = null"
          width="600"
        >
          <v-card>
            <v-card-title>
              Raw Mangrove Review
            </v-card-title>
            <v-card-text>
              {{ rawDialog }}
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-menu>
    </v-card-actions>
    <v-alert v-if="error" type="error" border="left" elevation="8">
      Error encountered: {{ error }}
    </v-alert>
  </v-card>
</template>

<script>
import { MARESI } from '../store/scheme-types'
import { imageUrl } from '../utils'
import Identicon from './Identicon'
export default {
  components: {
    Identicon
  },
  props: {
    review: Object,
    issuer: Object,
    subject: {
      type: Object,
      default: () => {
        return {}
      }
    },
    preview: Boolean
  },
  data() {
    return {
      actions: [
        {
          icon: 'mdi-thumb-up',
          tooltip: 'This is useful',
          action: this.useful,
          number: this.subject.positive_count
        },
        {
          icon: 'mdi-certificate',
          tooltip: 'Confirm this experience',
          action: this.confirm,
          number: this.subject.confirmed_count
        },
        {
          icon: 'mdi-comment-text-multiple',
          tooltip: 'Write a comment',
          action: this.request,
          number: this.subject.count
        }
      ],
      menu: [
        {
          title: 'Flag as innapropriate',
          action: this.flag
        },
        {
          title: 'Show raw Mangrove Review',
          action: this.showRaw
        }
      ],
      rawDialog: null,
      personalMeta: { is_personal_experience: 'true' }
    }
  },
  computed: {
    error() {
      return this.$store.state.errors.submit
    }
  },
  methods: {
    imageUrl(hash) {
      return imageUrl(hash)
    },
    reviewSub(signature) {
      return { sub: `${MARESI}:${signature}` }
    },
    request(signature) {
      this.$store.dispatch('saveReviews', this.reviewSub(signature))
    },
    useful(signature) {
      const claim = this.reviewSub(signature)
      claim.rating = 100
      this.$store.dispatch('submitReview', claim)
    },
    confirm(signature) {
      const claim = this.reviewSub(signature)
      claim.rating = 100
      claim.metadata = this.personalMeta
      this.$store.dispatch('submitReview', claim)
    },
    flag(review) {
      const claim = this.reviewSub(review.signature)
      claim.rating = 0
      // The review being reviewed is displayed above.
      claim.metadata = this.personalMeta
      this.$store.dispatch('submitReview', claim)
    },
    showRaw(review) {
      this.rawDialog = review
    }
  }
}
</script>
