<template>
  <v-list class="mt-n6">
    <v-list-item>
      <v-list-item-content>
        <v-text-field
          v-model.trim="privateInput"
          label="Paste your password here"
        />
      </v-list-item-content>
      <v-list-item-action>
        <v-btn :disabled="!privateInput" @click="loadPrivate">Log in</v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-alert v-if="error" type="warning" border="left" elevation="8">
      Private key not valid: {{ error }}
    </v-alert>
  </v-list>
</template>

<script>
import { set } from 'idb-keyval'
import { jwkToKeypair } from 'mangrove-reviews'
import { HAS_SAVED_KEY } from '~/store/indexeddb-types'

export default {
  data() {
    return {
      privateInput: null,
      loader: false,
      error: null
    }
  },
  methods: {
    async loadPrivate() {
      this.loader = true
      await this.importPrivate()
      this.loader = false
    },
    importPrivate() {
      let jwk
      try {
        jwk = JSON.parse(this.privateInput)
      } catch (e) {
        this.error = e
        return
      }
      return jwkToKeypair(jwk)
        .then(async (keypair) => {
          await this.$store.dispatch('setKeypair', keypair)
          set(HAS_SAVED_KEY, true)
          this.error = null
          const rs = await this.$store.dispatch('saveMyReviews', true)
          console.log('Fetched reviews: ', rs)
          this.$emit('login')
        })
        .catch((error) => {
          this.error = error
        })
    }
  }
}
</script>
