<template>
  <v-card>
    <v-list-item>
      <v-list-item-avatar color="grey"></v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title class="headline">{{
          (review.extra_hashes && review.extra_hashes.display_name) ||
            'Anonymous'
        }}</v-list-item-title>
        <v-list-item-subtitle
          >2 reviews <v-icon>mdi-thumb-up</v-icon>2</v-list-item-subtitle
        >
      </v-list-item-content>
    </v-list-item>
    <v-card-text>
      {{ review.iat }}
      <v-rating :value="(review.rating + 25) / 25"></v-rating>
      {{ review.opinion }}
      <div v-for="hash in review.extra_hashes" :key="hash">
        <img :src="imageUrl(hash)" />
      </div>
      {{ review.metadata }}
    </v-card-text>
    <v-card-actions v-if="!preview">
      <button v-on:click="flag(review.signature)">
        Flag as innapropriate.
      </button>
      <button v-on:click="request(review.signature)">
        See responses or indicate how useful this review was.
      </button>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  props: {
    review: Object,
    preview: Boolean
  },
  methods: {
    imageUrl(hash) {
      return `${process.env.VUE_APP_FILES_URL}/${hash}`
    },
    reviewStub(signature) {
      return { sub: `urn:MaReSi:${signature}` }
    },
    request(signature) {
      this.$store.dispatch('saveReviews', this.reviewStub(signature))
    },
    flag(signature) {
      const claim = this.reviewStub(signature)
      claim.rating = 0
      this.$store.dispatch('submitReview', claim)
    }
  }
}
</script>
