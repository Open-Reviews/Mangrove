<template>
  <v-container v-if="$store.state.selected">
    Subject info <br />
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
  }
}
</script>
