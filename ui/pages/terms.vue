<template>
  <div>
    <v-navigation-drawer v-html="toc" fixed class="mt-12" />
    <v-container>
      <v-row v-html="html" class="ml-12" />
    </v-container>
  </div>
</template>

<script>
import { html } from '~/content/Mangrove_Original_Services_ToS.md'
import { html as toc } from '~/content/terms/toc.md'
const AnchorJS = require('anchor-js')
const anchors = new AnchorJS()

export default {
  data() {
    return { html, toc }
  },
  mounted() {
    anchors.add()
  }
}
</script>
