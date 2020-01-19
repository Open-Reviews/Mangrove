<template>
  <v-container>
    <div v-for="(arg, i) in listArgs" :key="i">
      <Review
        :review="arg.review"
        :issuer="arg.issuer"
        :maresiSubject="arg.maresiSubject"
        :subjectTitle="arg.subjectTitle"
        class="my-2"
      />
      <ReviewList :rootSub="arg.rootSub" class="ml-2 mt-5" />
    </div>
  </v-container>
</template>

<script>
import Review from './Review'

export default {
  name: 'ReviewListBase',
  components: {
    Review
  },
  props: {
    // Array of objects with fields:
    // { review, issuer, maresiSubject, subjectTitle, rootSub }
    listArgs: {
      type: Array,
      default: () => []
    }
  },
  // Avoid issues with circular dependencies.
  beforeCreate() {
    this.$options.components.ReviewList = require('./ReviewList').default
  }
}
</script>
