<template>
  <v-container v-if="$store.state.selected">
    <v-card>
      <v-card-title>
        {{ subject.profile.title }}
      </v-card-title>
      <v-row>
        <v-rating :value="aggregateRating" half-increments></v-rating>
        {{ aggregateRating }} ({{ aggregateReviews }})
      </v-row>
    </v-card>
    <ReviewForm />
    <ReviewList />
  </v-container>
</template>

<script>
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'

export default {
  components: {
    ReviewForm,
    ReviewList
  },
  data() {
    return {
      aggregateRating: 4.3,
      aggregateReviews: 23
    }
  },
  computed: {
    subject() {
      return this.$store.state.selected
    }
  }
}
</script>
