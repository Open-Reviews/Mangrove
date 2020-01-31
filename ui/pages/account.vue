<template>
  <v-container style="max-width: 1200px">
    <v-row>
      <v-col>
        <h1 class="display-1">Your account</h1>
        <v-divider class="mb-2" />
        <v-card>
          <v-card-text>
            <div v-if="!savedKey">Returning reviewer? <LogIn /></div>
            <div v-if="hasLeftReview">
              If you would like to use this account in the future, please copy
              and save your password in a password manager or download it to
              your files.
              <KeyList sk>
                Your cryptographically generated password:
              </KeyList>
            </div>
          </v-card-text>
        </v-card>
        <AdvancedAccount />
      </v-col>
      <v-col>
        <YourReviews />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { get } from 'idb-keyval'
import { HAS_SAVED_KEY } from '~/store/indexeddb-types'
import LogIn from '~/components/LogIn'
import KeyList from '~/components/KeyList'
import AdvancedAccount from '~/components/AdvancedAccount'
import YourReviews from '~/components/YourReviews'

export default {
  components: {
    AdvancedAccount,
    YourReviews,
    LogIn,
    KeyList
  },
  data() {
    return {
      savedKey: undefined
    }
  },
  computed: {
    hasLeftReview() {
      const me = this.$store.getters.issuer(this.$store.state.publicKey)
      return me && me.count
    }
  },
  mounted() {
    get(HAS_SAVED_KEY).then((flag) => (this.savedKey = flag))
  },
  middleware: 'clear'
}
</script>
