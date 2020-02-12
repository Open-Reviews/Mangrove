<template>
  <v-container v-html="html" style="max-width: 1200px" />
</template>

<script>
import { html } from '../../Mangrove_Review_Standard.md'

export default {
  data() {
    return { html }
  }
}
</script>
