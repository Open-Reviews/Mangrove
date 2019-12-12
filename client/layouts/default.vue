<template>
  <v-app>
    <v-app-bar app>
      <router-link to="/">
        <v-img src="mangrove-thick.png" max-width="150" contain />
      </router-link>
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
    <v-footer app absolute>
      <v-col>
        <v-btn
          v-for="internal in internals"
          :key="internal.link"
          :to="internal.link"
          text
        >
          {{ internal.label }}
        </v-btn>
      </v-col>
      <v-col class="text-center">
        {{ new Date().getFullYear() }} — A
        <a :href="psUrl">PlantingSpace</a> Project -
        <a :href="ccbyUrl">CC-BY-4.0</a>
      </v-col>
      <v-col class="text-right">
        <v-btn
          v-for="social in socials"
          :key="social.icon"
          :href="social.link"
          icon
        >
          <v-icon>{{ social.icon }}</v-icon>
        </v-btn>
        <v-btn href="https://riot.im/" icon>
          <v-avatar>
            <v-img src="icon-riot.png" max-height="20" contain />
          </v-avatar>
        </v-btn>
        <v-btn href="https://opencollective.com" icon>
          <v-avatar>
            <v-img src="icon-collective.svg" max-height="20" contain />
          </v-avatar>
        </v-btn>
      </v-col>
    </v-footer>
  </v-app>
</template>

<script>
export default {
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
        { icon: 'mdi-twitter', link: 'https://twitter.com/mangroveReviews' },
        {
          icon: 'mdi-gitlab',
          link: 'https://gitlab.com/plantingspace/mangrove'
        }
      ]
    }
  },
  mounted() {
    this.$store.dispatch('generateKeypair')
  }
}
</script>
