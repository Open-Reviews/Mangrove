<template>
  <v-app :style="{ background: $vuetify.theme.themes[theme].background }">
    <v-app-bar app dense color="background">
      <router-link to="/">
        <v-img src="mangrove.png" max-width="220" contain />
      </router-link>
      <v-spacer />
      <v-toolbar-items class="mr-n4 hidden-sm-and-down">
        <v-btn
          v-for="item in menu"
          :to="item.to"
          v-html="item.label"
          :key="item.to"
          text
        />
        <v-btn text to="/account"> <v-icon>mdi-account-circle</v-icon></v-btn>
      </v-toolbar-items>
      <div class="hidden-md-and-up">
        <v-menu bottom left>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" icon>
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="item in menu" :to="item.to" :key="item.to">
              <v-list-item-title>{{ item.label }}</v-list-item-title>
            </v-list-item>
            <v-list-item to="/account">
              <v-list-item-title>Account</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-app-bar>
    <v-content class>
      <nuxt />
    </v-content>
    <v-footer
      v-if="$route.path !== '/search'"
      :class="isSmall ? 'text-center' : ''"
      :color="$vuetify.theme.themes[oppositeTheme].background"
      :dark="theme === 'light'"
      app
      absolute
      padless
    >
      <v-col :cols="isSmall ? 12 : 6" class="px-4 mb-n2">
        <v-btn
          v-for="(internal, i) in internals"
          :key="i"
          :to="internal.to"
          :href="internal.href"
          :target="internal.href ? '_blank' : ''"
          text
        >
          {{ internal.label }}
        </v-btn>
      </v-col>
      <v-col :class="isSmall || 'text-right'" class="mb-n2">
        <v-divider v-if="isSmall" class="mb-3" />
        <v-btn
          v-for="social in SOCIALS"
          :key="social.link"
          :href="social.link"
          target="_blank"
          icon
        >
          <v-icon v-if="social.icon">{{ social.icon }}</v-icon>
          <v-avatar v-else class="ml-n1">
            <v-img :src="social.img" max-height="28" contain />
          </v-avatar>
        </v-btn>
      </v-col>
      <v-col class="text-center" cols="12">
        <v-divider class="mb-2" />
        {{ new Date().getFullYear() }} — A
        <a
          :href="psUrl"
          style="text-decoration: none"
          class="white--text"
          target="_blank"
          >PlantingSpace</a
        >
        Project —
        <a
          :href="ccbyUrl"
          style="text-decoration: none"
          class="white--text"
          target="_blank"
          >CC-BY-4.0</a
        >
      </v-col>
    </v-footer>
    <script type="text/javascript">
      var fby = fby || []
      fby.push([
        'showTab',
        { id: '{{ feedbackId }}', position: 'right', color: '#FF1F3A' }
      ])
      ;(function() {
        var f = document.createElement('script')
        f.type = 'text/javascript'
        f.async = true
        f.src = '//cdn.feedbackify.com/f.js'
        var s = document.getElementsByTagName('script')[0]
        s.parentNode.insertBefore(f, s)
      })()
    </script>
  </v-app>
</template>

<script>
import { SOCIALS, GITLAB, OPEN_COLLECTIVE } from '~/store/data'

const FEEDBACK_IDS = {
  '/build': 15051,
  '/contribute': 15052,
  '/faq': 15054,
  '': 15050,
  '/search': 15049,
  '/account': 15053,
  '/terms': 15055
}

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
        { label: 'About', href: 'https://planting.space/mangrove.html' },
        { label: 'FAQ', to: 'faq' },
        { label: 'Terms & Privacy', to: 'terms' },
        { label: 'API', href: 'https://api.mangrove.reviews/swagger-ui' },
        { label: 'Develop', href: GITLAB },
        { label: 'Donations', href: OPEN_COLLECTIVE }
      ],
      SOCIALS
    }
  },
  computed: {
    theme() {
      return this.$vuetify.theme.dark ? 'dark' : 'light'
    },
    oppositeTheme() {
      return this.$vuetify.theme.dark ? 'light' : 'dark'
    },
    isSmall() {
      return this.$vuetify.breakpoint.smAndDown
    },
    feedbackId() {
      return FEEDBACK_IDS[this.$route.path] || 15050
    }
  },
  created() {
    this.$store.dispatch('generateKeypair')
  }
}
</script>

<style>
.v-card__text,
.v-card__title {
  word-break: normal;
}
.v-btn {
  text-transform: none !important;
}
</style>
