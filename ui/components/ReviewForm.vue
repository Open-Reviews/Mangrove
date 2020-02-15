<template>
  <div>
    <v-dialog v-model="value" :width="width" persistent>
      <v-card>
        <v-card-title v-html="subjectLine" class="justify-center" />
        <v-divider />
        <v-alert
          v-if="isMobileFirefox"
          type="warning"
          elevation="8"
          border="left"
        >
          Image upload may not work on Firefox Mobile.
        </v-alert>
        <v-rating v-model="rating" hover class="my-1 text-center" large />
        <v-card-text>
          <v-textarea
            v-model="opinion"
            :counter="MAX_OPINION_LENGTH"
            :maxlength="MAX_OPINION_LENGTH"
            :label="opinionLabel"
            auto-grow
            filled
            rows="3"
          />
          <ImageForm v-model="images" />

          <v-row align="center">
            <v-col>
              <UserHeader
                :pk="$store.state.publicKey"
                :metadata="$store.state.metadata"
                :count="hasReviewed"
                placeholder="[Add a name below]"
              />
            </v-col>
            <v-col v-if="!hasReviewed" class="mr-6">
              <div class="mb-1">
                <b>New here?</b> Post your first review to create an account
                with the posted information
              </div>
              <b>Returning reviewer?</b> <LogInDialog text />
            </v-col>
          </v-row>

          <v-divider />

          <MetaForm :scheme="subject.scheme" />

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
    <SaveKeyDialog @dismiss="clear" v-if="keyDialog" :count="hasReviewed" />
  </div>
</template>

<script>
import { get } from 'idb-keyval'
import { SUBMIT_ERROR } from '../store/mutation-types'
import { IS_AFFILIATED } from '../store/metadata-types'
import ImageForm from './ImageForm'
import MetaForm from './MetaForm'
import SaveKeyDialog from './SaveKeyDialog'
import UserHeader from './UserHeader'
import LogInDialog from './LogInDialog'
import { HAS_SAVED_KEY } from '~/store/indexeddb-types'
import { GEO, MARESI, ISBN, LEI, HTTPS } from '~/store/scheme-types'
import { MAX_OPINION_LENGTH, isMobileFirefox } from '~/utils'

const AFFILIATED_EXAMPLES = {
  [GEO]:
    'owner; friends/family of the owner; work there; receive compensation for reviewing',
  [ISBN]: 'author; friends/family of the author; publisher',
  [LEI]: 'owner; friends/family of the owner; employee; investor',
  [HTTPS]: 'owner; friends/family of the owner; employee; investor',
  [MARESI]: 'owner; friends/family of the owner; work there'
}

export default {
  name: 'ReviewForm',
  components: {
    ImageForm,
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
      width: 800,
      dialog: false,
      preview: false,
      rating: null,
      opinion: '',
      images: [],
      review: {},
      checkBoxes: {
        termsAgreed: false,
        isAffiliated: false
      },
      MAX_OPINION_LENGTH,
      dismissedRating: false,
      ratingDialog: false,
      keyDialog: false,
      isMobileFirefox: isMobileFirefox()
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
        images: this.images,
        metadata: {
          [IS_AFFILIATED]: this.checkBoxes.isAffiliated ? `true` : null
        }
      }
      if (this.rating) {
        stub.rating = this.rating * 25 - 25
      }
      return stub
    },
    opinionLabel() {
      if (this.subject.scheme === ISBN)
        return 'Describe your opinion about this book'
      if (this.subject.scheme === LEI)
        return 'Describe your experience with this company'
      return 'Describe your experience here'
    },
    ticks() {
      return [
        {
          ticked: 'isAffiliated',
          text: `I am affiliated${
            this.subject.scheme === MARESI
              ? ''
              : ' with <i>' + this.subject.title + '</i>'
          } (e.g., ${AFFILIATED_EXAMPLES[this.subject.scheme]})`
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
    },
    hasReviewed() {
      return this.issuer && this.issuer.count
    }
  },
  beforeCreate() {
    // Avoid issues with circular dependencies.
    this.$options.components.Review = require('./Review').default
    // Fetch reviews to prepopulate metadata and allow for full preview.
    this.$store.dispatch('saveMyReviews', true)
  },
  mounted() {
    this.$store.commit(SUBMIT_ERROR, null)
  },
  methods: {
    previewReview() {
      this.$store.dispatch('reviewContent', this.payloadStub).then((review) => {
        this.review = review
        this.preview = true
      })
    },
    submitReview() {
      if (
        !this.dismissedRating &&
        !this.rating &&
        this.subject.scheme !== MARESI
      ) {
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
      this.$emit('input', false)
      Object.assign(this.$data, this.$options.data())
    }
  }
}
</script>
