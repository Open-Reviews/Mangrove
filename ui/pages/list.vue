<template>
  <v-container style="max-width: 700px">
    <h1 v-text="title" class="display-1" />
    <v-divider class="mt-2" />
    <SchemeFilter :counts="counts" comments />
    <ReviewList :query="$route.query" />
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
      return this.$store.getters.reviewsAndCounts(this.$route.query).counts
    },
    title() {
      return this.$route.query.kid ? 'User profile' : 'Review list'
    }
  },
  middleware: 'review-list'
}
</script>
