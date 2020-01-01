<template>
  <v-app>
    <v-app-bar app dense>
      <router-link to="/">
        <v-img src="mangrove.png" max-width="170" contain />
      </router-link>
      <v-spacer />
      <v-toolbar-items class="mr-n4 hidden-sm-and-down">
        <v-btn
          v-for="item in menu"
          :to="item.to"
          v-html="item.label"
          :key="item.to"
        />
        <v-btn to="/settings"> <v-icon>mdi-account-circle</v-icon></v-btn>
      </v-toolbar-items>
      <div class="hidden-md-and-up">
        <v-menu bottom left>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" icon>
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="item in menu" :to="item.to" :key="item.to">
              <v-list-item-title>{{ item.label }}</v-list-item-title>
            </v-list-item>
            <v-list-item to="/settings">
              <v-list-item-title>Settings</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>
    <v-content>
      <v-container style="max-width: 1200px">
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
        <a :href="psUrl" style="text-decoration: none">PlantingSpace</a>
        Project -
        <a :href="ccbyUrl" style="text-decoration: none">CC-BY-4.0</a>
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
        <v-btn
          href="https://matrix.to/#/!NWvCdVEAXYJRnXTudO:matrix.org?via=matrix.org"
          icon
        >
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
      menu: [
        { to: '/build', label: 'Build on Mangrove' },
        { to: '/contribute', label: 'Contribute' }
      ],
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
