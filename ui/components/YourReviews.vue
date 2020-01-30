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

export default {
  components: {
    SchemeFilter,
    ReviewList
  },
  mounted() {
    this.$store.dispatch('saveMyReviews')
  }
}
</script>
