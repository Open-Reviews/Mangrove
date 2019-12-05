<template>
  <v-container>
    <h2>Your reviews</h2>
    Click on one of public keys to display the associated reviews here.
    <SchemeFilter />
    <ReviewList mine />
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
