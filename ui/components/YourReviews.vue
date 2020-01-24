<template>
  <v-container>
    <p class="display-1">Your reviews</p>
    <v-divider />
    <SchemeFilter />
    <ReviewList :rootIss="$store.state.publicKey" />
  </v-container>
</template>

<script>
import SchemeFilter from './SchemeFilter'
import ReviewList from './ReviewList'
import { subsToSubjects } from '~/store/apis'

export default {
  components: {
    SchemeFilter,
    ReviewList
  },
  async mounted() {
    const subs = await this.$store
      .dispatch('saveReviews', {
        iss: this.$store.state.publicKey
      })
      .then((rs) =>
        Object.values(rs.reviews).map((review) => review.payload.sub)
      )
    subsToSubjects(this.$axios, subs).map((promise) => {
      promise.then((subject) =>
        this.$store.dispatch('storeWithRating', [subject])
      )
    })
  }
}
</script>
