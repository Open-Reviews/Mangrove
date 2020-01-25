<template>
  <v-container>
    <v-row justify="space-between" class="mx-2">
      <p class="display-1">Your account</p>
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
            <span v-html="keyInfo" />
            <v-row justify="space-around">
              <v-btn :href="downloadKeyLink" :download="downloadKeyName">
                Download secret key
              </v-btn>
              <SwitchAccount />
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-divider />
      <KeyList sk>
        Secret key (your password)
      </KeyList>
      <v-card-text v-html="yourSecretKey" />
      <v-divider />
      <KeyList :keys="[$store.state.publicKey]">
        Public key (your identity)
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
import KeyList from './KeyList'
import SwitchAccount from './SwitchAccount'
import { html as yourPublicKey } from '~/content/settings/your-public-key.md'
import { html as yourSecretKey } from '~/content/settings/your-secret-key.md'
import {
  html as keyInfo,
  attributes as keyTitle
} from '~/content/settings/key-info.md'
import { downloadLink, skToJwk, pkDisplay } from '~/utils'

export default {
  components: {
    KeyList,
    SwitchAccount
  },
  data() {
    return {
      hint:
        'Save the secret key in a secure place accessible across devices, such as a password manager.',
      yourPublicKey,
      yourSecretKey,
      keyInfo,
      keyTitle
    }
  },
  computed: {
    downloadKeyName() {
      return `mangrove.reviews_SecretKey_${pkDisplay(
        this.$store.state.publicKey
      )}.json`
    }
  },
  methods: {
    async downloadKeyLink() {
      const secret = await skToJwk(this.$store.state.keyPair.privateKey)
      return downloadLink(JSON.stringify(secret))
    }
  }
}
</script>

<style scoped>
.v-expansion-panel:before {
  box-shadow: none !important;
}
</style>
