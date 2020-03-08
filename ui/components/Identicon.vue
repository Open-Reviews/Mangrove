<template>
  <v-avatar tile>
    <div
      v-html="identicon"
      style="width: 100%; height: 100%; display: flex; align-items: center"
    />
  </v-avatar>
</template>

<script>
import jdenticon from 'jdenticon'
export default {
  props: ['seed'],
  computed: {
    identicon() {
      return jdenticon.toSvg(this.seed, 100)
    }
  }
}
</script>
