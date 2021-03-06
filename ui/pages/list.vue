<template>
  <v-container>
    <h1 v-text="title" class="display-1 ml-3" />
    <v-divider class="mt-2 mb-2 ml-3" />
    <v-row>
      <v-col :cols="$vuetify.breakpoint.mdAndDown && 12" class="mt-n5">
        <v-container style="max-width: 700px">
          <SchemeFilter :counts="counts" comments class="mb-4"/>
          <ReviewList :query="$route.query" />
        </v-container>
      </v-col>
      <v-col v-if="mapPoints.length" class="mt-2">
        <SelectionMap :points="mapPoints" display />
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
  head() {
    return { title: this.title }
  },
  data() {
    return {
      counts: { null: 0 }
    }
  },
  computed: {
    title() {
      return this.$route.query.kid ? 'User profile' : 'Review list'
    },
    mapPoints() {
      return this.$store.getters.mapPoints(this.$route.query)
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
