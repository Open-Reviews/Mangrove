<template>
  <v-layout>
    <div v-html="html"></div>
  </v-layout>
</template>

<script>
import { html } from '../content/about.md'

export default {
  data() {
    return { html }
  }
}
</script>
