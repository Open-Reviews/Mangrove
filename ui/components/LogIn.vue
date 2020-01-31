<template>
  <v-list class="mt-n6">
    <v-list-item>
      <v-list-item-content>
        <v-text-field
          v-model.trim="privateInput"
          placeholder="Paste your password here"
        />
      </v-list-item-content>
      <v-list-item-action>
        <v-btn :disabled="!privateInput" @click="importPrivate">Log in</v-btn>
      </v-list-item-action>
    </v-list-item>
    <v-alert v-if="error" type="warning" border="left" elevation="8">
      Private key not valid: {{ error }}
    </v-alert>
  </v-list>
</template>

<script>
import { set } from 'idb-keyval'
import { HAS_SAVED_KEY } from '~/store/indexeddb-types'
import { jwkToKeypair } from '~/utils'

export default {
  data() {
    return {
      privateInput: null,
      error: null,
      show: false
    }
  },
  methods: {
    importPrivate() {
      let jwk
      try {
        jwk = JSON.parse(this.privateInput)
      } catch (e) {
        this.error = e
        return
      }
      jwkToKeypair(jwk)
        .then((keypair) => {
          this.$store.dispatch('setKeypair', keypair)
          set(HAS_SAVED_KEY, true)
          this.error = null
          this.show = false
        })
        .catch((error) => (this.error = error))
    }
  }
}
</script>
