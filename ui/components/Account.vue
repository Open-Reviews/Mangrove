<template>
  <v-container>
    <v-row justify="space-between" class="mx-2">
      <p class="display-1">Your identifier</p>
      <SwitchAccount />
    </v-row>
    <v-divider />
    <v-card v-if="$store.state.publicKey" class="my-5">
      <v-expansion-panels>
        <v-expansion-panel>
          <v-expansion-panel-header>
            {{ keyTitle.title }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-card-text v-html="keyInfo" />
            <v-row justify="space-around">
              <v-btn
                :href="downloadKeyLink"
                :download="downloadKeyName"
                color="secondary"
                class="black--text"
              >
                Download private key
              </v-btn>
              <SwitchAccount />
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-divider />
      <KeyList sk>
        Private key
      </KeyList>
      <v-card-text v-html="yourPrivateKey" />
      <v-divider />
      <KeyList :keys="[$store.state.publicKey]">
        Public key (your identifier)
      </KeyList>
      <v-card-text v-html="yourPublicKey" />
      <KeyList v-if="false" :keys="[$store.state.publicKey]">
        Other public keys
      </KeyList>
    </v-card>
    <v-row> </v-row>
  </v-container>
</template>

<script>
import { get } from 'idb-keyval'
import KeyList from './KeyList'
import SwitchAccount from './SwitchAccount'
import { PRIVATE_KEY } from '~/store/indexeddb-types'
import { html as yourPublicKey } from '~/content/settings/your-public-key.md'
import { html as yourPrivateKey } from '~/content/settings/your-private-key.md'
import {
  html as keyInfo,
  attributes as keyTitle
} from '~/content/settings/key-info.md'
import { downloadLink, pkDisplay } from '~/utils'

export default {
  components: {
    KeyList,
    SwitchAccount
  },
  data() {
    return {
      hint:
        'Save the private key in a secure place accessible across devices, such as a password manager.',
      yourPublicKey,
      yourPrivateKey,
      keyInfo,
      keyTitle
    }
  },
  computed: {
    downloadKeyName() {
      return `mangrove.reviews_PrivateKey_${pkDisplay(
        this.$store.state.publicKey
      )}.json`
    }
  },
  methods: {
    async downloadKeyLink() {
      const sk = await get(PRIVATE_KEY)
      return downloadLink(JSON.stringify(sk))
    }
  }
}
</script>

<style scoped>
.v-expansion-panel:before {
  box-shadow: none !important;
}
</style>
