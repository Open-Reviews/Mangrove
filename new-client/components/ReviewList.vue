<template>
  <div>
    <input id="mine" v-model="onlyMine" type="checkbox" />
    <label for="mine">Show only mine</label>
    <br />
    Showing reviews of {{ selectedUri }}
    <div v-for="review in reviews" :key="review.signature">
      {{ review.iss | truncate(20) }}
      {{ review.iat }}
      {{ (review.rating + 25) / 25 }}
      {{ review.opinion }}
      <div v-for="hash in review.extradata" :key="hash">
        <img :src="imageUrl(hash)" />
      </div>
      {{ review.metadata }}
      <button v-on:click="flag(review.signature)">
        Flag as innapropriate.
      </button>
      <button v-on:click="request(review.signature)">
        See responses or indicate how useful this review was.
      </button>
    </div>
    <br />
  </div>
</template>

<script>
export default {
  data() {
    return {
      onlyMine: false
    }
  },
  computed: {
    selectedUri() {
      return this.$store.state.selectedUri
    },
    reviews() {
      // TODO: Return generator to improve performance.
      return Object.values(this.$store.state.reviews).filter(
        (review) =>
          (this.selectedUri == null || review.sub === this.selectedUri) &&
          (!this.onlyMine || review.iss === this.$store.state.publicKey)
      )
    }
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
