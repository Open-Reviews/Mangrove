<template>
  <v-card>
    <v-subheader
      v-if="subjectTitle"
      v-text="subjectTitle"
      @click="selectSubject"
      style="cursor: pointer"
    />
    <v-list-item class="mb-n5">
      <v-list-item-avatar class="mr-2">
        <Identicon :seed="payload.iss" />
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title class="headline">{{ name() }}</v-list-item-title>
        <v-list-item-subtitle>{{ issuer.count }} reviews </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-card-text>
      <v-row v-if="payload.rating" align="center">
        <v-rating
          :value="(payload.rating + 25) / 25"
          readonly
          dense
          class="mr-2 ml-2"
        />
        Reviewed {{ new Date(payload.iat * 1000).toDateString() }}
      </v-row>
      {{ payload.opinion }}
      <v-row v-if="payload.extra_hashes">
        <v-img
          v-for="hash in payload.extra_hashes"
          :key="hash"
          :src="imageUrl(hash)"
          max-height="80"
          max-width="80"
          contain
        />
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
    <v-card-actions v-if="!preview" class="my-n8">
      <v-tooltip v-for="action in actions" :key="action.icon" top>
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            @click="action.action(review.signature)"
            :disabled="action.disabled"
            icon
            class="mr-2"
          >
            <v-icon class="mr-1" small>{{ action.icon }}</v-icon>
            {{ action.number }}
          </v-btn>
        </template>
        <span>{{ action.tooltip }}</span>
      </v-tooltip>
      <v-card-text class="ml-n5">
        <div
          v-if="maresiSubject.opinion_count"
          @click="requestResponses"
          style="cursor: pointer"
        >
          Read comments
        </div>
      </v-card-text>
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
        <FlagForm v-model="flagSubject" />
      </v-menu>
    </v-card-actions>
    <ReviewForm v-model="responseDialog" :subject="subjectWithTitle" />
  </v-card>
</template>

<script>
import Identicon from './Identicon'
import ReviewForm from './ReviewForm'
import FlagForm from './FlagForm'
import { MARESI } from '~/store/scheme-types'
import { imageUrl, displayName } from '~/utils'

export default {
  name: 'Review',
  components: {
    Identicon,
    ReviewForm,
    FlagForm
  },
  props: {
    review: Object,
    issuer: Object,
    maresiSubject: {
      type: Object,
      default: () => {}
    },
    preview: Boolean,
    subjectTitle: {
      type: String,
      default: () => ''
    }
  },
  data() {
    return {
      actions: [
        {
          icon: 'mdi-thumb-up',
          tooltip: 'This is useful',
          action: this.useful,
          number: this.maresiSubject.positive_count,
          disabled: this.review.payload.iss === this.$store.state.publicKey
        },
        {
          icon: 'mdi-certificate',
          tooltip: 'Confirm this experience',
          action: this.confirm,
          number: this.maresiSubject.confirmed_count,
          disabled: this.review.payload.iss === this.$store.state.publicKey
        },
        {
          icon: 'mdi-comment-text-multiple',
          tooltip: 'Write a comment',
          action: this.respond,
          number: this.maresiSubject.opinion_count,
          disabled: false
        }
      ],
      menu: [
        {
          title: 'Flag as inappropriate',
          action: this.showFlag
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
      flagReasons: [
        {
          description: `Violation of the Terms of Use`,
          items: [
            'The review contains offensive language that is violent, coarse, sexist, racist, accusatory, or defamatory.',
            'The review contains personal information that could be used to track, identify, contact or impersonate someone.',
            `The review violates someone else's intellectual property, privacy/confidentiality, or personality rights.`
          ]
        },
        {
          description: `Low-quality content`,
          items: [
            `The review is marketing or spam`,
            `The review is on the wrong subject profile`,
            `The content doesn't mention a buying or service experience and is solely ethical, political or value-laden opinion.`
          ]
        }
      ],
      raw: { json: undefined, cbor: undefined },
      flagSubject: null,
      personalMeta: { is_personal_experience: 'true' },
      responseDialog: false
    }
  },
  computed: {
    payload() {
      return this.review.payload
    },
    subjectWithTitle() {
      return {
        ...this.maresiSubject,
        title: displayName(this.payload.metadata),
        metadata: this.personalMeta
      }
    }
  },
  methods: {
    imageUrl(hash) {
      return imageUrl(hash)
    },
    payloadSub(signature) {
      return { sub: `${MARESI}:${signature}` }
    },
    respond(signature) {
      this.responseDialog = true
    },
    requestResponses() {
      this.$store.dispatch(
        'saveReviews',
        this.payloadSub(this.review.signature)
      )
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
    showFlag(review) {
      this.flagSubject = this.subjectWithTitle
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
      return displayName(this.payload.metadata)
    },
    selectSubject() {
      this.$store.dispatch('selectSubject', ['', this.payload.sub])
    }
  }
}
</script>
