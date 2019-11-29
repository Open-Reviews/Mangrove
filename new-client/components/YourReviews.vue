<template>
  <div>
    Click on one of public keys to display the associated reviews here.
    <SchemeFilter />
    <ReviewList />
  </div>
</template>

<script>
import SchemeFilter from './SchemeFilter'
import ReviewList from './ReviewList'

export default {
  components: {
    SchemeFilter,
    ReviewList
  }
}
</script>
