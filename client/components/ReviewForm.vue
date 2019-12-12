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
        Your public key
        <PubKeyList :keys="[$store.state.publicKey]" />
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
            <Review
              :review="review"
              :subject="subject"
              :issuer="$store.state.issuers[$store.state.publicKey]"
              preview
            />
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
        <v-btn @click="submitReview" text>
          Post publicly
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import MetaForm from './MetaForm'
import Review from './Review'
import PubKeyList from './PubKeyList'

export default {
  components: {
    MetaForm,
    Review,
    PubKeyList
  },
  data() {
    return {
      dialog: false,
      preview: false,
      rating: null,
      opinion: null,
      is_affiliated: false,
      termsAgreed: false,
      review: {}
    }
  },
  computed: {
    subject() {
      return this.$store.state.subjects[this.$route.query.sub]
    },
    reviewStub() {
      return {
        sub: this.$route.query.sub,
        rating: this.rating * 25 - 25,
        opinion: this.opinion
      }
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
