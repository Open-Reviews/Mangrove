<template>
  <v-app light>
    <v-app-bar dense app>
      <v-btn to="/" text>
        <v-icon>mdi-tree-outline</v-icon>
        <v-toolbar-title v-text="title" />
      </v-btn>
      <v-spacer />
      <v-toolbar-items>
        <v-btn to="using">Using Mangrove</v-btn>
        <v-btn to="contribute">Contribute</v-btn>
        <v-btn to="settings">
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </v-toolbar-items>
    </v-app-bar>
    <v-content>
      <v-container>
        <nuxt />
      </v-container>
    </v-content>
    <v-footer app>
      <v-btn
        v-for="internal in internals"
        :key="internal.link"
        :to="internal.link"
        text
      >
        {{ internal.label }}
      </v-btn>
      <v-spacer />
      <v-btn
        v-for="social in socials"
        :key="social.icon"
        :to="social.link"
        icon
      >
        <v-icon>{{ social.icon }}</v-icon>
      </v-btn>
      <v-card-text class="text-center">
        {{ new Date().getFullYear() }} —
        <strong>
          A <a :href="psUrl">PlantingSpace</a> Project -
          <a :href="ccbyUrl">CC-BY-4.0</a>
        </strong>
      </v-card-text>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  created() {
    this.$store.dispatch('generateKeypair')
  },
  data() {
    return {
      title: 'Mangrove',
      psUrl: 'https://planting.space',
      ccbyUrl: 'https://creativecommons.org/licenses/by/4.0',
      internals: [
        { label: 'About', link: 'about' },
        { label: 'FAQ', link: 'faq' },
        { label: 'Terms & Privacy', link: 'terms' }
      ],
      socials: [
        {
          icon: 'mdi-mastodon',
          link: 'https://mas.to/@PlantingSpace'
        },
        {
          icon: 'mdi-gitlab',
          link: 'https://gitlab.com/plantingspace/mangrove'
        },
        { icon: 'mdi-twitter', link: 'https://twitter.com/mangroveReviews' }
      ]
    }
  }
}
</script>
