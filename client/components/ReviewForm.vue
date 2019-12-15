<template>
  <v-dialog v-model="dialog" persistent>
    <template v-slot:activator="{ on }">
      <v-btn v-on="on">Write a review</v-btn>
    </template>
    <v-card>
      <v-card-title> Review {{ subject.title }} </v-card-title>
      <v-divider />
      <v-card-text>
        <v-rating v-model="rating" hover />
        <v-textarea
          v-model="opinion"
          label="Describe your experience here"
          counter="500"
          auto-grow
          filled
        />
        <ExtraForm v-on:uploaded="extra_hashes = $event" />
        Your public key
        <KeyList :keys="[$store.state.publicKey]" />
        <MetaForm />

        <v-list>
          <v-list-item>
            <v-list-item-action>
              <v-checkbox v-model="is_affiliated"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title
                >I am affiliated with Puccini (e.g., work there, friends with
                the owner, receive compensation for writing a
                review)</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>

          <v-list-item>
            <v-list-item-action>
              <v-checkbox v-model="termsAgreed"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title
                >I agree to the Terms of Service and Privacy Policy
                *</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-dialog v-model="preview">
          <v-card>
            <v-card-title>Preview</v-card-title>
            <v-card-text>
              <Review
                :review="review"
                :subject="subject"
                :issuer="$store.state.issuers[$store.state.publicKey]"
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
          :disabled="!termsAgreed || (!rating && !opinion.length)"
          text
        >
          Post publicly
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import ExtraForm from './ExtraForm'
import MetaForm from './MetaForm'
import Review from './Review'
import KeyList from './KeyList'

export default {
  components: {
    ExtraForm,
    MetaForm,
    Review,
    KeyList
  },
  data() {
    return {
      dialog: false,
      preview: false,
      rating: null,
      opinion: '',
      extra_hashes: [],
      is_affiliated: null,
      termsAgreed: false,
      review: {}
    }
  },
  computed: {
    subject() {
      return this.$store.state.subjects[this.$route.query.sub]
    },
    reviewStub() {
      const stub = {
        sub: this.$route.query.sub,
        opinion: this.opinion,
        extra_hashes: this.extra_hashes,
        metadata: { is_affiliated: this.is_affiliated }
      }
      if (this.rating) {
        stub.rating = this.rating * 25 - 25
      }
      return stub
    }
  },
  methods: {
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
