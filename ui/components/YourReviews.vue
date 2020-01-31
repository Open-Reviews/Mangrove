<template>
  <div>
    <h1 class="display-1">Your reviews</h1>
    <v-divider />
    <SchemeFilter />
    <ReviewList :rootIss="$store.state.publicKey" />
  </div>
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
