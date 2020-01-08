<template>
  <v-container>
    <p class="display-1">Your reviews</p>
    <v-divider />
    <br />
    <span
      >Click on one of public keys to display the associated reviews here.</span
    >
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
  }
}
</script>
