<template>
  <v-card v-if="$store.state.publicKey" class="my-5">
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ keyTitle.title }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-card-text v-html="keyInfo" />
          <v-divider />
          <KeyList :keys="[$store.state.publicKey]">
            {{ publicTitle.title }}
          </KeyList>
          <v-card-text v-html="yourPublicKey" />
          <KeyList v-if="false" :keys="[$store.state.publicKey]">
            Other public keys
          </KeyList>

          <v-divider />
          <KeyList sk>
            {{ privateTitle.title }}
          </KeyList>
          <v-card-text v-html="yourPrivateKey" />

          <v-divider />
          <v-card-subtitle>
            {{ switchTitle.title }}
          </v-card-subtitle>
          <v-card-text v-html="switchPrivateKey" />
          <LogIn />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script>
import KeyList from './KeyList'
import LogIn from './LogIn'
import {
  html as switchPrivateKey,
  attributes as switchTitle
} from '~/content/account/switch-private-key.md'
import {
  html as yourPublicKey,
  attributes as publicTitle
} from '~/content/account/your-public-key.md'
import {
  html as yourPrivateKey,
  attributes as privateTitle
} from '~/content/account/your-private-key.md'
import {
  html as keyInfo,
  attributes as keyTitle
} from '~/content/account/key-info.md'

export default {
  components: {
    KeyList,
    LogIn
  },
  data() {
    return {
      hint:
        'Save the private key in a secure place accessible across devices, such as a password manager.',
      publicTitle,
      yourPublicKey,
      privateTitle,
      yourPrivateKey,
      keyTitle,
      keyInfo,
      switchTitle,
      switchPrivateKey
    }
  }
}
</script>

<style scoped>
.v-expansion-panel:before {
  box-shadow: none !important;
}
</style>
