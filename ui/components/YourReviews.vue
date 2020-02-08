<template>
  <div>
    <h1 class="display-1">Your reviews</h1>
    <v-divider />
    <SchemeFilter :counts="counts" comments />
    <ReviewList :rootPk="$store.state.publicKey" @counted="counts = $event" />
  </div>
</template>

<script>
import SchemeFilter from './SchemeFilter'
import ReviewList from './ReviewList'

export default {
  components: {
    SchemeFilter,
    ReviewList
  },
  data() {
    return {
      counts: undefined
    }
  }
}
</script>
