<template>
  <v-container v-if="$store.state.selected">
    <v-card>
      <v-card-title>
        {{ subject.title }}
      </v-card-title>
      <v-row align="center" class="ma-auto">
        <v-rating :value="subject.aggregateRating" half-increments></v-rating>
        {{ subject.aggregateRating }} ({{ subject.aggregateReviews }})
      </v-row>
      <v-card-subtitle>{{ subject.subtitle }}</v-card-subtitle>
      <v-card-actions>
        <ReviewForm />
      </v-card-actions>
    </v-card>
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
  computed: {
    subject() {
      return this.$store.state.selected
    }
  }
}
</script>
