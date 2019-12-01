<template>
  <v-container>
    <h2>Your account</h2>
    <v-list>
      <v-subheader inset>Your default public key</v-subheader>
      <v-divider inset />
      <v-list-item v-if="$store.state.publicKey">
        {{ $store.state.publicKey.slice(0, 10) + '...' }}
      </v-list-item>
      <v-subheader inset>Your other public keys</v-subheader>
      <v-divider inset />
    </v-list>
    <v-row>
      <h3>Backup your private key</h3>
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-header
            >Make sure to back up your private key</v-expansion-panel-header
          >
          <v-expansion-panel-content
            ><span v-html="explanation"
          /></v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-row>
    <v-row>
      <v-btn @click="copySecret"
        >Copy your private key <v-icon>mdi-content-copy</v-icon></v-btn
      >
      {{ hint }}
    </v-row>
    <h2>Switch account</h2>
    Import another private key to access associated public keys and reviews
    <v-text-field
      v-model.trim="secretInput"
      placeholder="Paste your private key here"
    />
    <v-btn :disabled="!isValidInput" @click="importSecret">Import</v-btn>
  </v-container>
</template>

<script>
import { EMPTY_URIS, IMPORT_ERROR } from '../store/mutation-types'

export default {
  data() {
    return {
      explanation:
        'All reviews in the Mangrove data base are saved with a unique <b>public key</b>. If you wish to build up <b>reputation</b> within Mangrove, you should use the same public key as often as possible. You can, however, create several public keys for different purposes. They will all be linked to the same private key, and can be accessed only through this private key. Therefore, it is crucial that you copy and save the <b>private key</b> in a password manager or in another secure place. Please remember that <b>Mangrove does not store any private keys</b>. If you lose it, we cannot retrieve it.',
      hint:
        'Save the private key in a secure place accessible across devices, such as a password manager.',
      metadata: 'Mangrove private key.',
      secretInput: null
    }
  },
  computed: {
    isValidInput() {
      const jwk = JSON.parse(this.secretInput)
      return jwk && jwk.metadata === this.metadata
    }
  },
  methods: {
    copySecret() {
      crypto.subtle
        .exportKey('jwk', this.$store.state.keyPair.privateKey)
        .then((s) => {
          s.metadata = this.metadata
          const secret = JSON.stringify(s)
          // Create new element
          const el = document.createElement('textarea')
          // Set value (string to be copied)
          el.value = secret
          // Set non-editable to avoid focus and move outside of view
          el.setAttribute('readonly', '')
          el.style = { position: 'absolute', left: '-9999px' }
          document.body.appendChild(el)
          // Select text inside element
          el.select()
          // Copy text to clipboard
          document.execCommand('copy')
          // Remove temporary element
          document.body.removeChild(el)
        })
    },
    async importSecret() {
      const jwk = JSON.parse(this.secretInput)
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
        .catch((error) => this.$store.commit(IMPORT_ERROR, error))
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
        .catch((error) => this.$store.commit(IMPORT_ERROR, error))
      this.$store.dispatch('setKeypair', { privateKey: sk, publicKey: pk })
    },
    getMyReviews() {
      this.$store.commit(EMPTY_URIS)
      this.$store.dispatch('saveReviews', {
        publickey: this.$store.state.publicKey
      })
    }
  }
}
</script>
