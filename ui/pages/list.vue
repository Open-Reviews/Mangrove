<template>
  <v-container>
    <h1 class="display-1">User profile</h1>
    <v-divider />
    <SchemeFilter :counts="counts" comments />
    <ReviewList :rootPk="$route.query.kid" />
  </v-container>
</template>

<script>
import SchemeFilter from '~/components/SchemeFilter'
import ReviewList from '~/components/ReviewList'

export default {
  components: {
    SchemeFilter,
    ReviewList
  },
  computed: {
    counts() {
      return this.$store.getters.reviewsAndCounts(this.$route.query.kid).counts
    }
  },
  middleware: 'review-list'
}
</script>
