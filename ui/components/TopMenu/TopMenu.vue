<template>
  <v-app-bar app dense scroll-off-screen color="background">
    <router-link to="/" style="text-decoration: none">
      <v-row align="center">
        <v-avatar class="mx-2" tile>
          <v-img :src="require('~/assets/tree.png')" />
        </v-avatar>
        <span class="black--text headline">
          MANGROVE
        </span>
      </v-row>
    </router-link>
    <v-spacer />
    <v-toolbar-items class="mr-n4 hidden-sm-and-down">
      <v-menu v-for="(item, i) in menu" :key="i" open-on-hover offset-y>
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
          <div v-for="(item, i) in menu" :key="i">
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
</template>

<script>
import Identicon from '~/components/Identicon'

export default {
  components: {
    Identicon
  },
  data() {
    return {
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
      ]
    }
  }
}
</script>
