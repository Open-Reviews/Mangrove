<template>
  <v-list>
    <v-subheader><slot /></v-subheader>
    <v-divider />
    <v-list-item v-for="(key, i) in keys" :key="key" class="mt-5">
      <v-list-item-avatar>
        <v-icon v-if="sk" large>mdi-key</v-icon>
        <Identicon v-else :seed="key" />
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title v-if="sk">XXXX...</v-list-item-title>
        <v-list-item-title v-else>{{
          key.slice(0, 10) + '...'
        }}</v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-btn @click="copy(key)" icon>
          <v-icon>mdi-content-copy</v-icon>
        </v-btn>
      </v-list-item-action>
      <v-list-item-action v-if="sk">
        <v-btn>
          Display
        </v-btn>
      </v-list-item-action>
      <v-list-item-action v-else-if="i">
        <v-btn>
          Set default
        </v-btn>
      </v-list-item-action>
    </v-list-item>
  </v-list>
</template>

<script>
import Identicon from './Identicon'
export default {
  components: {
    Identicon
  },
  props: {
    // Assume that first one is the default one.
    keys: { type: Array, default: () => [null] },
    sk: Boolean
  },
  data() {
    return {
      metadata: 'Mangrove private key'
    }
  },
  methods: {
    secret() {
      return crypto.subtle
        .exportKey('jwk', this.$store.state.keyPair.privateKey)
        .then((s) => {
          s.metadata = this.metadata
          return s
        })
    },
    async copy(json) {
      if (this.sk) {
        json = await this.secret()
      }
      const secret = JSON.stringify(json)
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
    }
  }
}
</script>
