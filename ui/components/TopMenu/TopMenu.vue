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
    <v-toolbar-items class="hidden-sm-and-down">
      <v-btn nuxt text link to="/use-cases">
        Use Cases
      </v-btn>
      <v-menu open-on-hover offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" text> Technology </v-btn>
        </template>
        <v-list>
          <v-list-item href="https://docs.mangrove.reviews/" target="_blank">
            <v-list-item-title>API</v-list-item-title>
          </v-list-item>
          <v-list-item href="https://js.mangrove.reviews/" target="_blank">
            <v-list-item-title>JS Library</v-list-item-title>
          </v-list-item>
          <v-list-item nuxt link to="/standard">
            <v-list-item-title>Standard</v-list-item-title>
          </v-list-item>
          <v-list-item
            href="https://gitlab.com/plantingspace/mangrove"
            target="_blank"
          >
            <v-list-item-title>Contribute</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn text link href="https://open-reviews.net">
        Join us
      </v-btn>
      <v-btn nuxt text link to="/account">
        Account
        <Identicon :seed="$store.state.publicKey" class="ml-2" />
      </v-btn>
    </v-toolbar-items>
    <v-menu bottom left>
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" class="hidden-md-and-up" icon>
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item nuxt link to="/use-cases">
          Use Cases
        </v-list-item>
        <v-divider></v-divider>
        <v-list class="pl-2">
          <v-subheader>Technology</v-subheader>
          <v-list-item href="https://docs.mangrove.reviews/" target="_blank">
            <v-list-item-title>API</v-list-item-title>
          </v-list-item>
          <v-list-item href="https://js.mangrove.reviews/" target="_blank">
            <v-list-item-title>JS Library</v-list-item-title>
          </v-list-item>
          <v-list-item nuxt link to="/standard">
            <v-list-item-title>Standard</v-list-item-title>
          </v-list-item>
          <v-list-item
            href="https://gitlab.com/plantingspace/mangrove"
            target="_blank"
          >
            <v-list-item-title>Contribute</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-divider></v-divider>
        <v-list-item link href="https://open-reviews.net">
          Join us
        </v-list-item>
        <v-list-item nuxt link to="/account">
          Account
          <Identicon :seed="$store.state.publicKey" class="ml-2" />
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script>
import Identicon from '~/components/Identicon'

export default {
  components: {
    Identicon
  }
}
</script>
