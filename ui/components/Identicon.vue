<template>
  <v-avatar tile>
    <div v-html="identicon" />
  </v-avatar>
</template>

<script>
import jdenticon from 'jdenticon'
export default {
  props: ['seed'],
  computed: {
    identicon() {
      return jdenticon.toSvg(this.seed, 50)
    }
  }
}
</script>
