<template>
  <v-dialog v-model="dialog" :width="width" persistent>
    <template v-slot:activator="{ on }">
      <v-btn v-on="on">Write a review</v-btn>
    </template>
    <v-card>
      <v-card-title>{{ subjectLine }}</v-card-title>
      <v-divider />
      <v-card-text>
        <v-rating v-model="rating" hover class="my-5" large />
        <v-textarea
          v-model="opinion"
          label="Describe your experience here"
          counter="500"
          auto-grow
          filled
        />
        <ExtraForm
          :extraHashes="extraHashes"
          @uploaded="addHashes($event)"
          @deleted="deleteHash($event)"
        />
        <KeyList :keys="[$store.state.publicKey]">Your public key</KeyList>
        <MetaForm />

        <v-list>
          <v-list-item v-for="tick in ticks" :key="tick.text">
            <v-list-item-action>
              <v-checkbox v-model="checkBoxes[tick.ticked]"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title class="text-wrap">{{
                tick.text
              }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-dialog v-model="preview" :width="width - 100">
          <v-card>
            <v-card-title>Preview</v-card-title>
            <v-card-text>
              <Review
                :review="review"
                :subject="subject"
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
        <v-btn @click="dialog = false" text>
          Cancel
        </v-btn>
        <v-btn @click.stop="previewReview" text>Preview</v-btn>
        <v-btn
          @click="submitReview"
          :disabled="!checkBoxes.termsAgreed || (!rating && !opinion.length)"
          text
        >
          Post publicly
        </v-btn>
      </v-card-actions>
      <v-alert v-if="error" type="error" border="left" elevation="8">
        Error encountered: {{ error }}
      </v-alert>
    </v-card>
  </v-dialog>
</template>

<script>
import ExtraForm from './ExtraForm'
import MetaForm from './MetaForm'
import Review from './Review'
import KeyList from './KeyList'
import { MARESI } from '~/store/scheme-types'

export default {
  components: {
    ExtraForm,
    MetaForm,
    Review,
    KeyList
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
      }
    }
  },
  computed: {
    subject() {
      return this.$store.state.subjects[this.$route.query.sub]
    },
    subjectLine() {
      return this.subject.scheme === MARESI
        ? `Comment on ${this.subject.subtitle}'s review`
        : `Review ${this.subject.title}`
    },
    reviewStub() {
      const stub = {
        sub: this.$route.query.sub,
        opinion: this.opinion,
        extra_hashes: this.extraHashes,
        metadata: { is_affiliated: this.checkBoxes.isAffiliated ? true : null }
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
          text: 'I agree to the Terms of Service and Privacy Policy*'
        }
      ]
    },
    error() {
      return this.$store.state.errors.submit
    }
  },
  mounted() {
    this.$store
      .dispatch('getIssuer', this.$store.state.publicKey)
      .then((issuer) => {
        this.issuer = issuer
      })
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
      this.$store.dispatch('reviewContent', this.reviewStub).then((review) => {
        this.review = review
        this.preview = true
      })
    },
    submitReview() {
      this.$store.dispatch('submitReview', this.reviewStub)
      this.dialog = false
    }
  }
}
</script>
