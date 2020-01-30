<template>
  <v-avatar v-html="identicon" />
</template>

<script>
import jdenticon from 'jdenticon'
export default {
  props: ['seed'],
  computed: {
    identicon() {
      return jdenticon.toSvg(this.seed, 55)
    }
  }
}
</script>
