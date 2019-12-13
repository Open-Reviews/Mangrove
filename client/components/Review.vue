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
      <v-row v-if="review.extra_hashes">
        <v-col v-for="hash in review.extra_hashes" :key="hash">
          <v-img :src="imageUrl(hash)" max-width="80" max-height="80" />
        </v-col>
      </v-row>
      <v-expansion-panels v-if="metadata && metadata.length">
        <v-expansion-panel>
          <v-expansion-panel-header>
            Additional information
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-simple-table>
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-left">Key</th>
                    <th class="text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="kv in metadata" :key="kv[0]">
                    <td>{{ kv[0] }}</td>
                    <td>{{ kv[1] }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
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
      metadata:
        this.review.metadata &&
        Object.entries(this.review.metadata).filter((key, _) =>
          ['client_uri', 'display_name'].some((hidden) => key === hidden)
        ),
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
