<template>
  <div>
    <v-col
      v-if="isBig"
      cols="2"
      style="position: fixed; background: white; height: 100%"
    >
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
    <v-row>
      <v-col v-if="isBig" cols="3" />
      <v-col v-html="html" :class="'mx-12 ' + isBig && 'px-12'" />
    </v-row>
  </div>
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
  computed: {
    isBig() {
      return this.$vuetify.breakpoint.mdAndUp
    }
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
