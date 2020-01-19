<template>
  <v-list>
    <v-subheader class="mb-n7"><slot /></v-subheader>
    <template v-for="(key, i) in keys">
      <v-list-item v-if="sk" :key="key" class="mt-5">
        <v-list-item-avatar tile>
          <v-icon large>mdi-key</v-icon>
        </v-list-item-avatar>
        <v-form
          v-on:submit.prevent
          style="display: inline-block; white-space: nowrap"
        >
          <v-list-item-content>
            <v-list-item-title>
              <v-text-field
                id="password"
                :value="keyString(key)"
                required
                class="full-width"
                type="password"
                name="password"
                autocomplete="password"
              />
            </v-list-item-title>
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
        </v-form>
        <v-list-item-action>
          <v-dialog>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on" icon>
                <v-icon>mdi-eye</v-icon>
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
      </v-list-item>
      <v-list-item v-else :key="key" class="mt-5">
        <v-list-item-avatar tile>
          <Identicon :seed="key" />
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ pkDisplay(key) }}</v-list-item-title>
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
        <v-list-item-action v-if="i">
          <v-btn>
            Set default
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </template>
  </v-list>
</template>

<script>
import Identicon from './Identicon'
import { copyToClipboard, skToJwk, pkDisplay } from '~/utils'

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
      secret: undefined,
      pkDisplay
    }
  },
  async mounted() {
    this.secret = await skToJwk(this.$store.state.keyPair.privateKey)
  },
  methods: {
    keyString(json) {
      if (this.sk) {
        json = this.secret
      }
      return JSON.stringify(json)
    },
    copy(json) {
      copyToClipboard(this.keyString(json))
    }
  }
}
</script>
