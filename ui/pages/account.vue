<template>
  <v-container :style="`max-width: ${hasLeftReview ? 1300 : 800}px`">
    <v-row>
      <v-col>
        <h1 class="display-1">Your account</h1>
        <v-divider class="mb-2" />
        <v-card>
          <div v-if="!hasLeftReview">
            <v-card-title class="justify-center">
              New here?
            </v-card-title>
            <v-card-actions class="justify-center">
              <v-btn to="/">
                Write a review
              </v-btn>
            </v-card-actions>
            <v-divider class="mt-8" />
            <v-card-title class="justify-center">
              Returning reviewer?
            </v-card-title>
            <v-card-actions class="justify-center">
              <LogInDialog />
            </v-card-actions>
            <v-divider class="my-8" />
          </div>
          <div v-else>
            <v-card-text>
              You wrote [xx] review[s] with this account. You can build up your reputation to make your opinion count more by using                this same account for your future reviews, and by receiving Likes and Confirmations from other users.   
              </b>
              To always be able to access this account, please copy and save the password below, ideally in a password manager, or                 download it to your files.
              <KeyList sk>
                Your cryptographically generated password:
              </KeyList>
            </v-card-text>
          </div>
        </v-card>
        <AdvancedAccount />
      </v-col>
      <v-col v-if="hasLeftReview">
        <YourReviews />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import LogInDialog from '~/components/LogInDialog'
import KeyList from '~/components/KeyList'
import AdvancedAccount from '~/components/AdvancedAccount'
import YourReviews from '~/components/YourReviews'

export default {
  components: {
    AdvancedAccount,
    YourReviews,
    LogInDialog,
    KeyList
  },
  computed: {
    hasLeftReview() {
      const me = this.$store.getters.issuer(this.$store.state.publicKey)
      return me && me.count
    }
  },
  middleware: 'account'
}
</script>
