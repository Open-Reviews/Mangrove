<template>
  <v-list class="mt-n6">
    <v-alert
      v-if="isMobileFirefox"
      type="warning"
      elevation="8"
      class="mt-6"
      border="left"
    >
      Login is not possible due to lack of support for cryptographic primitives in Firefox for Android, please try another browser.
    </v-alert>
    <template v-else>
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
    </template>
  </v-list>
</template>

<script>
import { set } from 'idb-keyval'
import { jwkToKeypair } from 'mangrove-reviews'
import { HAS_SAVED_KEY } from '~/store/indexeddb-types'
import { isMobileFirefox } from '~/utils'

export default {
  data() {
    return {
      privateInput: null,
      loader: false,
      error: null,
      isMobileFirefox: isMobileFirefox()
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
        // Make sure to accept escaped JSON from file download.
        if (typeof jwk === 'string') {
          jwk = JSON.parse(jwk)
        }
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
