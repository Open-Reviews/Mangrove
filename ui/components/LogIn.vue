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
import { jwkToKeypair } from 'mangrove-js'
import { HAS_SAVED_KEY } from '~/store/indexeddb-types'

export default {
  data() {
    return {
      privateInput: null,
      error: null
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
          this.$emit('success')
        })
        .catch((error) => (this.error = error))
    }
  }
}
</script>
