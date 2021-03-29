<template>
  <v-row>
    <v-col v-for="(arg, i) in listArgs" :key="i" :cols="cols">
      <Review
        :review="arg.review"
        :issuer="arg.issuer"
        :maresiSubject="arg.maresiSubject"
        :subjectTitle="arg.subjectTitle"
        :dense="dense"
        :hideMetaTags="hideMetaTags"
        :commentsVisible="commentsVisible[i]"
        @toggleComments="toggleComments(i)"
        class="mb-7"
      />
      <ReviewList v-if="!dense && commentsVisible[i]" :query="{ sub: arg.rootSub }" class="ml-4" />
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
  data: function() {
    return {
      commentsVisible: this.listArgs.map(_ => false)
    }
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
    dense: Boolean,
    hideMetaTags: Boolean
  },
  // Avoid issues with circular dependencies.
  beforeCreate() {
    this.$options.components.ReviewList = require('./ReviewList').default
  },
  methods: {
    toggleComments(i){
      this.commentsVisible[i] = !this.commentsVisible[i]
    }
  }
}
</script>
