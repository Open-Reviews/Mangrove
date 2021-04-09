<template>
  <v-container>
    <h1 v-text="title" class="display-1 ml-3" />
    <v-divider class="mt-2 mb-2 ml-3" />
    <v-row>
      <v-col :cols="$vuetify.breakpoint.mdAndDown && 12" class="mt-n5">
        <v-container style="max-width: 700px">
          <SchemeFilter :counts="counts" comments class="mb-4"/>
          <ReviewList :query="isProfilePage ? { kid: $route.query.kid } : $route.query"  />
          <template v-if="counts['urn:maresi']">
          <h2 class="display-1 ml-3 mb-3" >Comments</h2>
          <ReviewList :query="isProfilePage ? { kid: $route.query.kid } : $route.query" comments />
          </template>
        </v-container>
      </v-col>
      <v-col v-if="mapPoints && mapPoints.length" class="mt-2">
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
    isDetailPage() {
      return !!this.$route.query.signature
    },
    isProfilePage() {
      return !!this.$route.query.kid
    },
    title() {
      return this.isProfilePage ? 'User profile' : 'Review list'
    },
    mapPoints() {
      return this.$store.getters.mapPoints(this.$route.query)
    }
  },
  mounted() {
    this.counts = this.$store.getters.reviewsAndCounts(this.isDetailPage ? this.$route.query : {
      kid: this.isProfilePage ? this.$route.query.kid : this.$store.state.publicKey
    }).counts
  },
  middleware: 'review-list'
}
</script>
