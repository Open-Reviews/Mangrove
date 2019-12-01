<template>
  <v-container v-if="$store.state.selected">
    <v-card>
      <v-card-title>
        {{ subject.profile.title }}
      </v-card-title>
      <v-row> <v-rating value="4"></v-rating> 4.3 (23) </v-row>
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
  computed: {
    subject() {
      return this.$store.state.selected
    }
  }
}
</script>
