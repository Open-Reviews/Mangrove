<template>
  <v-app :style="{ background: $vuetify.theme.themes[theme].background }">
    <v-app-bar app dense scroll-off-screen color="background">
      <router-link to="/" style="text-decoration: none">
        <v-row align="center">
          <v-avatar class="mx-2">
            <canvas id="canvas" />
          </v-avatar>
          <span class="black--text headline">
            MANGROVE
          </span>
        </v-row>
      </router-link>
      <v-spacer />
      <v-toolbar-items class="mr-n4 hidden-sm-and-down">
        <v-menu v-for="item in menu" :key="item.to" open-on-hover offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              :to="Array.isArray(item.to) ? '' : item.to"
              :href="item.href"
              v-bind="attrs"
              v-on="on"
              :target="item.href ? '_blank' : ''"
              text
            >
              <span v-html="item.label" />
              <Identicon
                v-if="item.to === '/account'"
                :seed="$store.state.publicKey"
                class="ml-2"
              />
            </v-btn>
          </template>
          <v-list v-if="Array.isArray(item.to)">
            <v-list-item
              v-for="dropdown in item.to"
              :href="dropdown.href"
              :key="dropdown.href"
              target="_blank"
            >
              <v-list-item-title>{{ dropdown.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar-items>
      <div class="hidden-md-and-up">
        <v-menu bottom left>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on" icon>
              <v-icon>mdi-menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <div v-for="item in menu" :key="item.to">
              <v-list-item
                :to="Array.isArray(item.to) ? '' : item.to"
                :href="item.href"
                :target="item.href ? '_blank' : ''"
              >
                <v-list-item-title>{{ item.label }}</v-list-item-title>
                <Identicon
                  v-if="item.to === '/account'"
                  :seed="$store.state.publicKey"
                />
              </v-list-item>
              <v-list v-if="Array.isArray(item.to)" class="ml-2">
                <v-list-item
                  v-for="dropdown in item.to"
                  :href="dropdown.href"
                  :key="dropdown.href"
                  target="_blank"
                >
                  <v-list-item-title>{{ dropdown.label }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
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
import tree from 'ps-trees'
import Identicon from '~/components/Identicon'
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
    Identicon
  },
  data() {
    return {
      title: 'Mangrove',
      menu: [
        { to: '/use-cases', label: 'Use Cases' },
        {
          to: [
            { label: 'API', href: 'https://docs.mangrove.reviews/' },
            { label: 'JS Library', href: 'https://js.mangrove.reviews/' },
            { label: 'Standard', href: 'https://mangrove.reviews/standard' },
            {
              label: 'Contribute',
              href: 'https://gitlab.com/plantingspace/mangrove'
            }
          ],
          label: 'Technology'
        },
        {
          label: 'Join us',
          href: 'https://open-reviews.net'
        },
        { to: '/account', label: 'Account' }
      ],
      oraUrl: 'https://open-reviews.net',
      ccbyUrl: 'https://creativecommons.org/licenses/by/4.0',
      internals: [
        { label: 'Blog', href: 'https://blog.mangrove.reviews' },
        { label: 'FAQ', to: 'faq' },
        { label: 'Terms & Privacy', to: 'terms' },
        {
          label: 'Code',
          href: LINKS.Gitlab.link
        },
        {
          label: 'API',
          href: 'https://docs.mangrove.reviews'
        }
      ],
      socials: ['Mastodon', 'Twitter', 'Riot', 'Email'].map(
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
  mounted() {
    tree(document.getElementById('canvas'), 'Mangrove')
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
