<template>
  <v-layout>
    <div v-html="html"></div>
  </v-layout>
</template>

<script>
import { html } from '../content/faq.md'

export default {
  data() {
    return { html }
  }
}
</script>
