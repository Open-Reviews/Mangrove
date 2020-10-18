<template>
  <v-app :style="{ background: $vuetify.theme.themes[theme].background }">
    <top-menu />
    <v-content class>
      <nuxt />
    </v-content>
    <v-footer
      v-if="$route.path !== '/search'"
      :class="isSmall ? 'text-center' : ''"
      :color="$vuetify.theme.themes[oppositeTheme].background"
      dark
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
          v-for="social in socials"
          :key="social.link"
          :href="social.link"
          rel="me"
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
        {{ new Date().getFullYear() }} —
        <a
          :href="oraUrl"
          style="text-decoration: none"
          class="white--text"
          target="_blank"
          >Open Reviews Association</a
        >
        —
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
        const f = document.createElement('script')
        f.type = 'text/javascript'
        f.async = true
        f.src = '//cdn.feedbackify.com/f.js'
        const s = document.getElementsByTagName('script')[0]
        s.parentNode.insertBefore(f, s)
      })()
    </script>
  </v-app>
</template>

<script>
import TopMenu from '../components/TopMenu/TopMenu.vue'
import { LINKS } from '~/store/links'

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
  components: {
    TopMenu
  },
  data() {
    return {
      title: 'Mangrove',
      oraUrl: 'https://open-reviews.net',
      ccbyUrl: 'https://creativecommons.org/licenses/by/4.0',
      internals: [
        { label: 'Blog', href: 'https://blog.open-reviews.net' },
        { label: 'FAQ', to: 'faq' },
        { label: 'Terms & Privacy', to: 'terms' },
        {
          label: 'Code',
          href: LINKS.Gitlab.link
        },
        {
          label: 'API',
          href: 'https://docs.mangrove.reviews'
        },
        {
          label: 'Download data',
          href: 'https://api.mangrove.reviews/reviews'
        }
      ],
      socials: ['Mastodon', 'Twitter', 'Element', 'Email'].map(
        (wanted) => LINKS[wanted]
      ),
      toc: ['/terms'],
      techDropdown: false
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
  word-break: normal !important;
}
.v-btn {
  text-transform: none !important;
}
.v-application p {
  margin-bottom: 0em;
  margin-top: 1em;
}
.v-application h1,
.v-application h2,
.v-application h3,
.v-application h4,
.v-application code {
  margin-top: 1em;
}
</style>
