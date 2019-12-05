<template>
  <v-container>
    <h2>Your account</h2>
    <v-card v-if="$store.state.publicKey">
      <v-card-title>Default public key</v-card-title>
      <v-row>
        <v-col align="center">
          <v-icon>mdi-circle</v-icon>
        </v-col>
        <v-col>
          <v-row>
            <v-card-subtitle>42 reviews · 23 rated useful</v-card-subtitle>
          </v-row>
          <v-row>
            <v-card-text
              >{{ $store.state.publicKey.slice(0, 10) + '...' }}
              <v-icon>mdi-content-copy</v-icon>
            </v-card-text>
          </v-row>
        </v-col>
      </v-row>
    </v-card>
    <v-card v-if="false">
      Your other public keys
    </v-card>
    <v-row>
      <v-btn @click="copySecret"
        >Copy to save your private key <v-icon>mdi-content-copy</v-icon></v-btn
      >
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-header>Why?</v-expansion-panel-header>
          <v-expansion-panel-content
            ><span v-html="explanation"
          /></v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-row>
    <h2>Switch account</h2>
    Import another private key to access associated public keys and reviews
    <v-text-field
      v-model.trim="secretInput"
      placeholder="Paste your private key here"
    />
    <v-btn :disabled="!secretInput" @click="importSecret">Import</v-btn>
    <v-alert v-if="error" type="warning" border="left" elevation="8">
      Private key not valid: {{ error }}
    </v-alert>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      explanation:
        'All reviews in the Mangrove data base are saved with a unique <b>public key</b>. If you wish to build up <b>reputation</b> within Mangrove, you should use the same public key as often as possible. You can, however, create several public keys for different purposes. They will all be linked to the same private key, and can be accessed only through this private key. Therefore, it is crucial that you copy and save the <b>private key</b> in a password manager or in another secure place. Please remember that <b>Mangrove does not store any private keys</b>. If you lose it, we cannot retrieve it.',
      hint:
        'Save the private key in a secure place accessible across devices, such as a password manager.',
      metadata: 'Mangrove private key',
      secretInput: null,
      error: null
    }
  },
  mounted() {
    this.$store.dispatch('saveReviews', {
      publickey: this.$store.state.publicKey
    })
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
    }
  }
}
</script>
