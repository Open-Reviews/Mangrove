<template>
  <v-dialog v-model="show" width="600">
    <template v-slot:activator="{ on }">
      <a v-on="on">Log in</a>
    </template>
    <v-card>
      <v-card-title>
        Log in
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model.trim="privateInput"
          placeholder="Paste your password here"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="!privateInput" @click="importPrivate">Log in</v-btn>
        <v-alert v-if="error" type="warning" border="left" elevation="8">
          Private key not valid: {{ error }}
        </v-alert>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
