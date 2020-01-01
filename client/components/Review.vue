<template>
  <v-card>
    <v-list-item>
      <v-list-item-avatar>
        <Identicon :seed="payload.iss" />
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title class="headline">{{ name() }}</v-list-item-title>
        <v-list-item-subtitle>{{ issuer.count }} reviews </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-card-text>
      <v-row align="center">
        <v-rating :value="(payload.rating + 25) / 25" dense></v-rating>
        Reviewed {{ new Date(payload.iat * 1000).toDateString() }}
      </v-row>
      {{ payload.opinion }}
      <v-row v-if="payload.extra_hashes">
        <v-col v-for="hash in payload.extra_hashes" :key="hash">
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
    <v-card-actions>
      <v-tooltip v-for="action in actions" :key="action.icon" top>
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            @click="action.action(review.signature)"
            :disabled="preview"
            icon
          >
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
          :value="raw.json"
          @click:outside="raw.json = null"
          width="600"
        >
          <v-card>
            <v-card-title>
              Raw Mangrove Review
            </v-card-title>
            <v-card-subtitle>
              JSON
            </v-card-subtitle>
            <v-card-text v-html="raw.json" />
            <v-card-subtitle>
              CBOR
            </v-card-subtitle>
            <v-card-text v-html="raw.cbor" />
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
        this.review.payload.metadata &&
        Object.entries(this.review.payload.metadata).filter((key, _) =>
          ['client_uri', 'display_name'].some((hidden) => key === hidden)
        ),
      raw: { json: undefined, cbor: undefined },
      personalMeta: { is_personal_experience: 'true' }
    }
  },
  computed: {
    error() {
      return this.$store.state.errors.submit
    },
    payload() {
      return this.review.payload
    }
  },
  methods: {
    imageUrl(hash) {
      return imageUrl(hash)
    },
    payloadSub(signature) {
      return { sub: `${MARESI}:${signature}` }
    },
    request(signature) {
      this.$store.dispatch('selectSubject', [
        {},
        this.payloadSub(signature).sub
      ])
    },
    useful(signature) {
      const claim = this.payloadSub(signature)
      claim.rating = 100
      this.$store.dispatch('submitReview', claim)
    },
    confirm(signature) {
      const claim = this.payloadSub(signature)
      claim.rating = 100
      claim.metadata = this.personalMeta
      this.$store.dispatch('submitReview', claim)
    },
    flag(review) {
      if (!this.preview) {
        const claim = this.payloadSub(review.signature)
        claim.rating = 0
        // The review being reviewed is displayed above.
        claim.metadata = this.personalMeta
        this.$store.dispatch('submitReview', claim)
      }
    },
    showRaw(review) {
      this.raw.json = JSON.stringify(
        { signature: review.signature, payload: review.payload },
        null,
        2
      )
      this.raw.cbor = JSON.stringify(
        { signature: review.signature, payload: review.encodedPayload },
        null,
        2
      )
    },
    name() {
      const meta = this.payload.metadata
      if (!meta) {
        return 'Anonymous'
      }
      if (meta.given_name || meta.family_name) {
        const realName = [meta.given_name, meta.family_name]
          .filter((n) => n)
          .join(' ')
        if (meta.display_name) {
          return `${meta.display_name} (${realName})`
        } else {
          return realName
        }
      } else if (meta.display_name) {
        return meta.display_name
      } else {
        return 'Anonymous'
      }
    }
  }
}
</script>
