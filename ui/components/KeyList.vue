<template>
  <v-list>
    <v-subheader><slot /></v-subheader>
    <v-divider class="mb-n3" />
    <v-list-item v-for="(key, i) in keys" :key="key" class="mt-5">
      <v-list-item-avatar>
        <v-icon v-if="sk" large>mdi-key</v-icon>
        <Identicon v-else :seed="key" />
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title v-if="sk">XXXXXXXXXXXXXXX</v-list-item-title>
        <v-list-item-title v-else>{{
          key.slice(0, 10) + '...' + key.slice(-10)
        }}</v-list-item-title>
      </v-list-item-content>
      <v-list-item-action>
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-btn @click="copy(key)" v-on="on" icon>
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </template>
          Copy to clipboard
        </v-tooltip>
      </v-list-item-action>
      <v-list-item-action v-if="sk">
        <v-dialog>
          <template v-slot:activator="{ on }">
            <v-btn v-on="on">
              Display
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              Your secret key
            </v-card-title>
            <v-card-text>
              <span v-html="secret" />
            </v-card-text>
          </v-card>
        </v-dialog>
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
import { copyToClipboard } from '~/utils'

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
      metadata: 'Mangrove secret key',
      secret: undefined
    }
  },
  async mounted() {
    this.secret = await crypto.subtle
      .exportKey('jwk', this.$store.state.keyPair.secretKey)
      .then((s) => {
        s.metadata = this.metadata
        return s
      })
  },
  methods: {
    copy(json) {
      if (this.sk) {
        json = this.secret
      }
      const secret = JSON.stringify(json)
      copyToClipboard(secret)
    }
  }
}
</script>
