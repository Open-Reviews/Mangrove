<template>
  <div>
    <v-dialog v-model="value" :width="width" persistent>
      <v-card>
        <v-card-title v-html="subjectLine" />
        <v-divider />
        <v-card-text>
          <v-rating v-model="rating" hover class="my-5" large />
          <v-textarea
            v-model="opinion"
            :counter="MAX_OPINION_LENGTH"
            :maxlength="MAX_OPINION_LENGTH"
            label="Describe your experience here"
            auto-grow
            filled
          />
          <ExtraForm
            :extraHashes="extraHashes"
            @uploaded="addHashes($event)"
            @deleted="deleteHash($event)"
          />
          <MetaForm />
          <KeyList :keys="[$store.state.publicKey]" class="my-n4"
            >Your public key</KeyList
          >

          <v-list>
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
    <SaveKeyDialog @dismiss="clear" v-if="keyDialog" />
  </div>
</template>

<script>
import { get } from 'idb-keyval'
import { SUBMIT_ERROR } from '../store/mutation-types'
import ExtraForm from './ExtraForm'
import MetaForm from './MetaForm'
import KeyList from './KeyList'
import SaveKeyDialog from './SaveKeyDialog'
import { HAS_IMPORTED_KEY } from '~/store/indexeddb-types'
import { MARESI } from '~/store/scheme-types'
import { MAX_OPINION_LENGTH } from '~/utils'

export default {
  name: 'ReviewForm',
  components: {
    ExtraForm,
    MetaForm,
    KeyList,
    SaveKeyDialog
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
      issuer: undefined,
      checkBoxes: {
        termsAgreed: false,
        isAffiliated: false
      },
      MAX_OPINION_LENGTH,
      dismissedRating: false,
      ratingDialog: false,
      keyDialog: false
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
          is_affiliated: this.checkBoxes.isAffiliated ? `true` : null
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
    }
  },
  mounted() {
    this.$store.commit(SUBMIT_ERROR, null)
    this.$store
      .dispatch('getIssuer', this.$store.state.publicKey)
      .then((issuer) => {
        this.issuer = issuer
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
          get(HAS_IMPORTED_KEY).then((hasImported) => {
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
