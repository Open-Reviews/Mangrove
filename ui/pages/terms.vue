<template>
  <v-container v-html="html" style="max-width: 1200px" />
</template>

<script>
import { html } from '../content/Mangrove_Original_Services_ToU.md'

export default {
  data() {
    return { html }
  }
}
</script>
