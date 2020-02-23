<template>
  <v-container>
    <h1 v-text="title" class="display-1" />
    <v-divider class="mt-2" />
    <v-row>
      <v-col :cols="$vuetify.breakpoint.mdAndDown && 12" class="mt-n5">
        <v-container style="max-width: 700px">
          <SchemeFilter :counts="counts" comments />
          <ReviewList :query="$route.query" />
        </v-container>
      </v-col>
      <v-col v-if="$store.getters.mapPoints.length">
        <SelectionMap :points="$store.getters.mapPoints" display />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SchemeFilter from '~/components/SchemeFilter'
import ReviewList from '~/components/ReviewList'
import SelectionMap from '~/components/SelectionMap'

export default {
  components: {
    SchemeFilter,
    ReviewList,
    SelectionMap
  },
  data() {
    return {
      counts: { null: 0 }
    }
  },
  computed: {
    title() {
      return this.$route.query.kid ? 'User profile' : 'Review list'
    }
  },
  mounted() {
    this.counts = this.$store.getters.reviewsAndCounts({
      kid: this.$store.state.publicKey
    }).counts
  },
  middleware: 'review-list'
}
</script>
