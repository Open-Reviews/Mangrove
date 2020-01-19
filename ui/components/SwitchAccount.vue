<template>
  <v-dialog v-model="show" width="600">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on">Switch account</v-btn>
    </template>
    <v-card>
      <v-card-title>
        Switch account
      </v-card-title>
      <v-card-text>
        <p v-html="switchContent" />
        <v-text-field
          v-model.trim="secretInput"
          placeholder="Paste your secret key here"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="!secretInput" @click="importSecret">Import</v-btn>
        <v-alert v-if="error" type="warning" border="left" elevation="8">
          Secret key not valid: {{ error }}
        </v-alert>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { set } from 'idb-keyval'
import { HAS_IMPORTED_KEY } from '~/store/indexeddb-types'
import { jwkToKeypair } from '~/utils'
import { html as switchContent } from '~/content/settings/switch-account.md'

export default {
  data() {
    return {
      switchContent,
      secretInput: null,
      error: null,
      show: false
    }
  },
  methods: {
    importSecret() {
      let jwk
      try {
        jwk = JSON.parse(this.secretInput)
      } catch (e) {
        this.error = e
        return
      }
      jwkToKeypair(jwk)
        .then((keypair) => {
          this.$store.dispatch('setKeypair', keypair)
          set(HAS_IMPORTED_KEY, true)
          this.error = null
          this.show = false
        })
        .catch((error) => (this.error = error))
    }
  }
}
</script>
