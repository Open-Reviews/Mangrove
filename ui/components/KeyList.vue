<template>
  <v-list>
    <v-alert v-if="copying" type="success">
      {{ copyText }}
    </v-alert>
    <v-subheader class="mb-n7"><slot /></v-subheader>
    <template v-for="(key, i) in keyStrings">
      <v-list-item :key="key" class="mt-5">
        <v-list-item-avatar tile>
          <v-icon v-if="sk" large>mdi-key</v-icon>
          <Identicon :seed="key" v-else />
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title v-if="sk">
            <v-text-field
              id="password"
              value="Press copy or view"
              required
              class="full-width mr-5"
              type="password"
              name="password"
              autocomplete="password"
            />
          </v-list-item-title>
          <v-list-item-title v-else>{{ pkDisplay(key) }}</v-list-item-title>
        </v-list-item-content>
        <v-list-item-action>
          <v-btn
            @click="copy(key)"
            :color="sk ? 'secondary' : ''"
            class="black--text"
          >
            <v-icon>mdi-content-copy</v-icon>
            Copy
          </v-btn>
        </v-list-item-action>
        <v-list-item-action>
          <v-dialog>
            <template v-slot:activator="{ on }">
              <v-btn v-on="on">
                <v-icon>mdi-eye</v-icon>
                View
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                Your {{ sk ? 'private' : 'public' }} key
              </v-card-title>
              <v-card-text>
                <span v-html="key" />
              </v-card-text>
            </v-card>
          </v-dialog>
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
import { get } from 'idb-keyval'
import Identicon from './Identicon'
import { pkDisplay } from '~/utils'
import { PRIVATE_KEY } from '~/store/indexeddb-types'

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
      copyText: 'Copied to clipboard!',
      secret: undefined,
      pkDisplay,
      copying: false
    }
  },
  computed: {
    keyStrings() {
      return this.keys.map((key) => (this.sk ? this.secret : key))
    }
  },
  mounted() {
    get(PRIVATE_KEY).then((s) => (this.secret = JSON.stringify(s)))
  },
  methods: {
    copy(string) {
      this.copying = true
      this.$copyText(string)
        .then(() =>
          setTimeout(() => {
            this.copying = false
          }, 2000)
        )
        .catch((e) => console.error(e))
    }
  }
}
</script>
