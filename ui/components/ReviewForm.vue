<template>
  <div>
    <v-dialog v-model="value" :width="width" persistent>
      <v-card>
        <v-card-title v-html="subjectLine" class="justify-center" />
        <v-divider />
        <v-rating v-model="rating" hover class="my-1 text-center" large />
        <v-card-text>
          <v-textarea
            v-model="opinion"
            :counter="MAX_OPINION_LENGTH"
            :maxlength="MAX_OPINION_LENGTH"
            label="Describe your experience here"
            auto-grow
            filled
            rows="3"
          />
          <ExtraForm
            :extraHashes="extraHashes"
            @uploaded="addHashes($event)"
            @deleted="deleteHash($event)"
          />

          <v-divider />

          <v-row align="center">
            <v-col>
              <UserHeader
                :pk="$store.state.publicKey"
                :metadata="$store.state.metadata"
                :count="issuer && issuer.count"
              />
            </v-col>
            <v-spacer />
            <div v-if="!savedKey" class="mr-6">
              Returning reviewer? <LogInDialog />
            </div>
          </v-row>

          <MetaForm />

          <v-divider />

          <v-list class="mb-n3">
            <v-list-item v-for="tick in ticks" :key="tick.text">
              <v-list-item-action>
                <v-checkbox v-model="checkBoxes[tick.ticked]"></v-checkbox>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title v-html="tick.text" class="text-wrap" />
              </v-list-item-content>
            </v-list-item>
          </v-list>
          <v-dialog v-model="preview" :width="width - 100">
            <v-card>
              <v-card-title>Preview</v-card-title>
              <v-card-text>
                <Review
                  :review="review"
                  :maresiSubject="subject"
                  :issuer="issuer"
                  preview
                />
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn @click="preview = false" text>Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn @click.stop="clear" text>
            Cancel
          </v-btn>
          <v-btn @click.stop="previewReview" text>Preview</v-btn>
          <v-btn
            @click="submitReview"
            :disabled="!checkBoxes.termsAgreed || (!rating && !opinion.length)"
            class="black--text"
            color="secondary"
          >
            Post publicly
          </v-btn>
        </v-card-actions>
        <v-alert v-if="error" type="error" border="left" elevation="8">
          Error encountered: {{ error }}
        </v-alert>
      </v-card>
      <v-dialog :value="ratingDialog" :width="width - 200">
        <v-card>
          <v-card-title>
            Would you like to leave a rating as well?
          </v-card-title>
          <v-rating v-model="rating" hover class="my-2 mx-4" large />
          <v-card-actions>
            <v-spacer />
            <v-btn
              @click.stop="submitReview"
              color="secondary"
              class="black--text"
              >Submit</v-btn
            >
            <v-btn
              @click.stop="
                dismissedRating = true
                submitReview()
              "
              >Dismiss</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-dialog>
    <SaveKeyDialog
      @dismiss="clear"
      v-if="keyDialog"
      :count="issuer && issuer.count"
    />
  </div>
</template>

<script>
import { get } from 'idb-keyval'
import { SUBMIT_ERROR, SET_META } from '../store/mutation-types'
import { IS_AFFILIATED, RECURRING } from '../store/metadata-types'
import ExtraForm from './ExtraForm'
import MetaForm from './MetaForm'
import SaveKeyDialog from './SaveKeyDialog'
import UserHeader from './UserHeader'
import LogInDialog from './LogInDialog'
import { HAS_SAVED_KEY } from '~/store/indexeddb-types'
import { MARESI } from '~/store/scheme-types'
import { MAX_OPINION_LENGTH } from '~/utils'

export default {
  name: 'ReviewForm',
  components: {
    ExtraForm,
    MetaForm,
    SaveKeyDialog,
    LogInDialog,
    UserHeader
  },
  props: {
    value: Boolean,
    subject: Object
  },
  data() {
    return {
      width: 700,
      dialog: false,
      preview: false,
      rating: null,
      opinion: '',
      extraHashes: [],
      review: {},
      checkBoxes: {
        termsAgreed: false,
        isAffiliated: false
      },
      MAX_OPINION_LENGTH,
      dismissedRating: false,
      ratingDialog: false,
      keyDialog: false,
      savedKey: undefined
    }
  },
  computed: {
    subjectLine() {
      return this.subject.scheme === MARESI
        ? `Comment on <span class="blue--text">&nbsp;${this.subject.title}</span>'s review`
        : this.subject.title
    },
    payloadStub() {
      const stub = {
        sub: this.subject.sub,
        opinion: this.opinion,
        extra_hashes: this.extraHashes,
        metadata: {
          [IS_AFFILIATED]: this.checkBoxes.isAffiliated ? `true` : null
        }
      }
      if (this.rating) {
        stub.rating = this.rating * 25 - 25
      }
      return stub
    },
    ticks() {
      return [
        {
          ticked: 'isAffiliated',
          text: `I am affiliated with ${this.subject.title} (e.g., work there,
                friends with the owner, receive compensation for writing a
                review)`
        },
        {
          ticked: 'termsAgreed',
          text: `I agree to the
            <a href="${process.env.BASE_URL}/terms" target="_blank">
              Terms of Service and Privacy Policy
            </a>*`
        }
      ]
    },
    error() {
      return this.$store.state.errors.submit
    },
    issuer() {
      return this.$store.getters.issuer(this.$store.state.publicKey)
    }
  },
  mounted() {
    this.$store.commit(SUBMIT_ERROR, null)
    get(HAS_SAVED_KEY).then((flag) => (this.savedKey = flag))
    // Fetch reviews to prepopulate metadata and allow for full preview.
    this.$store.dispatch('saveMyReviews').then(() => {
      const myReviews = Object.values(this.$store.state.reviews).filter(
        ({ payload }) => {
          return payload.iss === this.$store.state.publicKey
        }
      )
      if (!myReviews.length) {
        return
      }
      const newestReview = myReviews.reduce(function(prev, current) {
        return prev.payload.iat > current.payload.iat ? prev : current
      })
      Object.entries(newestReview.payload.metadata).map(
        ([k, v]) =>
          RECURRING.includes(k) && this.$store.commit(SET_META, [k, v])
      )
    })
  },
  // Avoid issues with circular dependencies.
  beforeCreate() {
    this.$options.components.Review = require('./Review').default
  },
  methods: {
    deleteHash(index) {
      this.extraHashes.splice(index, 1)
    },
    addHashes(hashes) {
      hashes.map((hash) => {
        if (!this.extraHashes.includes(hash)) {
          this.extraHashes.push(hash)
        }
      })
    },
    previewReview() {
      this.$store.dispatch('reviewContent', this.payloadStub).then((review) => {
        this.review = review
        this.preview = true
      })
    },
    submitReview() {
      if (!this.dismissedRating && !this.rating) {
        this.ratingDialog = true
        return
      }
      if (this.dismissedRating) {
        this.rating = null
      }
      this.ratingDialog = false
      // Close the dialog if successful.
      this.$store.dispatch('submitReview', this.payloadStub).then(
        (outcome) =>
          outcome &&
          get(HAS_SAVED_KEY).then((hasImported) => {
            if (!hasImported) {
              this.$emit('input', false)
              this.keyDialog = true
            } else {
              this.clear()
            }
          })
      )
    },
    clear() {
      Object.assign(this.$data, this.$options.data())
      this.$emit('input', false)
    }
  }
}
</script>
