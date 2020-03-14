<template>
  <v-row>
    <v-col v-for="(arg, i) in listArgs" :key="i" :cols="cols">
      <Review
        :review="arg.review"
        :issuer="arg.issuer"
        :maresiSubject="arg.maresiSubject"
        :subjectTitle="arg.subjectTitle"
        :dense="dense"
        class="mb-7"
      />
      <ReviewList :query="{ sub: arg.rootSub }" class="ml-4" />
    </v-col>
  </v-row>
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
    },
    cols: {
      type: Number,
      default: () => 12
    },
    dense: Boolean
  },
  // Avoid issues with circular dependencies.
  beforeCreate() {
    this.$options.components.ReviewList = require('./ReviewList').default
  }
}
</script>
