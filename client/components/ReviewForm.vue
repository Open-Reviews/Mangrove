<template>
  <v-dialog v-model="dialog" persistent>
    <template v-slot:activator="{ on }">
      <v-btn v-on="on">Write a review</v-btn>
    </template>
    <v-card>
      <v-card-title>
        Review {{ $store.state.subjects[$route.query.sub].title }}
      </v-card-title>
      <v-rating v-model="rating" hover class="mx-4" />
      <v-textarea
        v-model="opinion"
        label="Describe your experience here"
        counter="500"
        auto-grow
        class="mx-4"
      />
      <MetaForm />
      <v-btn @click.stop="previewReview">Preview</v-btn>
      <v-dialog v-model="preview">
        <v-card>
          <v-card-title>Preview</v-card-title>
          <Review :review="review" preview />
          <v-card-actions>
            <v-spacer />
            <v-btn @click="preview = false" text>Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-card-text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna a
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false" text>
          Cancel
        </v-btn>
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

export default {
  components: {
    MetaForm,
    Review
  },
  data() {
    return {
      dialog: false,
      preview: false,
      rating: null,
      opinion: null,
      review: {}
    }
  },
  computed: {
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
