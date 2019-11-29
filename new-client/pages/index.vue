<template>
  <div>
    <Results v-if="$store.state.query" />
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
  }
}
</script>
