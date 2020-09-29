<template>
  <v-row>
    <v-col cols="12" md="2">
      <v-list>
        <v-subheader>Table of contents</v-subheader>
        <v-list-item
          v-for="item in toc"
          :key="item.label"
          :to="{ path: $route.path, hash: item.to }"
          class="mt-n1"
        >
          <v-list-item-content>
            <v-list-item-title v-text="item.label" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-col>
    <v-col v-html="html" class="px-12" cols="12" md="10" />
  </v-row>
</template>

<script>
const AnchorJS = require('anchor-js')
const anchors = new AnchorJS()

export default {
  props: {
    html: {
      type: String,
      default: () => ''
    }
  },
  data() {
    return { toc: undefined }
  },
  mounted() {
    anchors.add()
    this.toc = anchors.elements
      .filter((el) => el.tagName === 'H2')
      .map((el) => {
        return {
          label: el.textContent,
          to: el.lastChild.hash
        }
      })
  }
}
</script>
