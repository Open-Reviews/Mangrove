<template>
  <div>
    <Results v-if="$route.query.q" />
    <Front v-else />
  </div>
</template>

<script>
import Front from '../components/Front'
import Results from '../components/Results'

export default {
  components: {
    Front,
    Results
  },
  middleware: 'search'
}
</script>
