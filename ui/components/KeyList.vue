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
          <v-text-field
            :id="sk ? 'password' : ''"
            :value="key"
            :type="!sk || showPrivate ? 'text' : 'password'"
            :name="sk ? 'password' : ''"
            :autocomplete="sk ? 'password' : ''"
            @click:append="() => (showPrivate = !showPrivate)"
            :append-icon="appendIcon"
            required
            class="full-width mr-5"
          />
        </v-list-item-content>
        <template v-if="$vuetify.breakpoint.mdAndUp">
          <v-list-item-action v-if="sk">
            <v-btn :href="downloadKeyLink" :download="downloadKeyName">
              <v-icon class="mr-1">mdi-folder-download-outline</v-icon>
              Download
            </v-btn>
          </v-list-item-action>
          <v-list-item-action>
            <v-btn @click="copy(key)" color="secondary" class="black--text">
              <v-icon small class="mr-1">mdi-content-copy</v-icon>
              Copy
            </v-btn>
          </v-list-item-action>
          <v-list-item-action v-if="i">
            <v-btn>
              Set default
            </v-btn>
          </v-list-item-action>
        </template>
      </v-list-item>
      <v-row :key="key" v-if="$vuetify.breakpoint.smAndDown" justify="center">
        <v-btn v-if="sk" :href="downloadKeyLink" :download="downloadKeyName">
          <v-icon class="mr-1">mdi-folder-download-outline</v-icon>
          Download
        </v-btn>
        <v-btn @click="copy(key)" color="secondary" class="black--text">
          <v-icon small class="mr-1">mdi-content-copy</v-icon>
          Copy
        </v-btn>
        <v-btn v-if="i">
          Set default
        </v-btn>
      </v-row>
    </template>
  </v-list>
</template>

<script>
// TODO: fix ugly button repetition.
import { get } from 'idb-keyval'
import Identicon from './Identicon'
import { downloadLink, pemDisplay } from '~/utils'
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
      copying: false,
      showPrivate: false,
      private: undefined
    }
  },
  computed: {
    keyStrings() {
      return this.keys.map((key) => (this.sk ? this.private : key))
    },
    appendIcon() {
      return this.sk ? (this.showPrivate ? 'mdi-eye-off' : 'mdi-eye') : ''
    },
    downloadKeyName() {
      return (
        this.$store.state.publicKey &&
        `mangrove.reviews_PrivateKey_${pemDisplay(
          this.$store.state.publicKey
        )}.json`
      )
    },
    downloadKeyLink() {
      return this.private && downloadLink(JSON.parse(this.private))
    }
  },
  mounted() {
    get(PRIVATE_KEY).then((s) => (this.private = JSON.stringify(s)))
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
