<template>
  <v-layout>
    <div v-html="html"></div>
  </v-layout>
</template>

<script>
import { html } from '../content/Mangrove_Original_Services_ToU.md'

export default {
  data() {
    return { html }
  }
}
</script>
