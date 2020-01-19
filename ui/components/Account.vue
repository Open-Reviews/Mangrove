<template>
  <v-container>
    <v-row justify="space-between" class="mx-2">
      <p class="display-1">Your account</p>
      <v-dialog v-model="switcherDialog" width="600">
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
    </v-row>
    <v-divider />
    <v-card v-if="$store.state.publicKey" class="my-5">
      <KeyList sk>
        Secret key |
        <v-dialog width="600">
          <template v-slot:activator="{ on }">
            <a v-on="on"> &nbsp; Learn more about saving and exporting</a>
          </template>
          <v-card>
            <v-card-title>
              What is a secret key?
            </v-card-title>
            <v-card-text>
              <span v-html="yourSecretKey" />
            </v-card-text>
          </v-card>
        </v-dialog>
      </KeyList>
      <KeyList :keys="[$store.state.publicKey]">
        Default public key |
        <v-dialog width="600">
          <template v-slot:activator="{ on }">
            <a v-on="on"> &nbsp; Learn more</a>
          </template>
          <v-card>
            <v-card-title>
              What is a public key?
            </v-card-title>
            <v-card-text>
              <span v-html="yourPublicKey" />
            </v-card-text>
          </v-card>
        </v-dialog>
      </KeyList>
      <KeyList v-if="false" :keys="[$store.state.publicKey]">
        Other public keys
      </KeyList>
    </v-card>
    <v-row> </v-row>
  </v-container>
</template>

<script>
import KeyList from './KeyList'
import { html as switchContent } from '~/content/settings/switch-account.md'
import { html as yourPublicKey } from '~/content/settings/your-public-key.md'
import { html as yourSecretKey } from '~/content/settings/your-secret-key.md'

export default {
  components: {
    KeyList
  },
  data() {
    return {
      hint:
        'Save the secret key in a secure place accessible across devices, such as a password manager.',
      metadata: 'Mangrove secret key',
      switchContent,
      yourPublicKey,
      yourSecretKey,
      switcherDialog: false,
      secretInput: null,
      error: null
    }
  },
  methods: {
    async importSecret() {
      let jwk
      try {
        jwk = JSON.parse(this.secretInput)
      } catch (e) {
        this.error = e
        return
      }
      if (jwk && jwk.metadata === this.metadata) {
        this.error = null
      } else {
        this.error = `does not contain the required metadata field "${this.metadata}"`
        return
      }
      const sk = await crypto.subtle
        .importKey(
          'jwk',
          jwk,
          {
            name: 'ECDSA',
            namedCurve: 'P-256'
          },
          true,
          ['sign']
        )
        .catch((e) => {
          this.error = e
        })
      delete jwk.d
      delete jwk.dp
      delete jwk.dq
      delete jwk.q
      delete jwk.qi
      jwk.key_ops = ['verify']
      const pk = await crypto.subtle
        .importKey(
          'jwk',
          jwk,
          {
            name: 'ECDSA',
            namedCurve: 'P-256'
          },
          true,
          ['verify']
        )
        .catch((e) => {
          this.error = e
        })
      this.$store.dispatch('setKeypair', { privateKey: sk, publicKey: pk })
      this.switcherDialog = false
    }
  }
}
</script>
