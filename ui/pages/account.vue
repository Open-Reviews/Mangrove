<template>
  <v-container :style="`max-width: ${reviewCount ? 1300 : 800}px`">
    <v-row v-if="!$store.state.publicKey" justify="center">
      <h1 class="display-3">Loading...</h1>
    </v-row>
    <v-row v-else>
      <v-col>
        <h1 class="display-1">Your account</h1>
        <v-divider class="mb-2" />
        <v-card>
          <div v-if="!reviewCount">
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
              <LogInDialog @login="load" />
            </v-card-actions>
            <v-divider class="my-8" />
          </div>
          <div v-else>
            <v-row justify="center">
              <div>
                <UserHeader
                  :pk="$store.state.publicKey"
                  :metadata="$store.state.metadata"
                  :count="reviewCount"
                  placeholder="Anonymous"
                />
              </div>
            </v-row>
            <v-card-text>
              You can build your reputation by using the same account for your
              future reviews, and by receiving Likes and Confirmations from
              other users.
              <br />
              <br />
              To always be able to access this account, please copy and save the
              password below in your password manager, or download it to your
              files.
              <KeyList sk>
                Your cryptographically generated password:
              </KeyList>
            </v-card-text>
            <v-card-actions class="justify-center">
              <LogOut @logout="load" />
            </v-card-actions>
          </div>
        </v-card>
        <AdvancedAccount />
      </v-col>
      <v-col v-if="reviewCount">
        <h1 class="display-1">Your reviews</h1>
        <v-divider />
        <SchemeFilter :counts="counts" comments />
        <ReviewList :query="{ kid: $store.state.publicKey }" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SchemeFilter from '~/components/SchemeFilter'
import ReviewList from '~/components/ReviewList'
import LogInDialog from '~/components/LogInDialog'
import KeyList from '~/components/KeyList'
import AdvancedAccount from '~/components/AdvancedAccount'
import UserHeader from '~/components/UserHeader'
import LogOut from '~/components/LogOut'

export default {
  head() {
    return {
      title: 'User Account'
    }
  },
  components: {
    AdvancedAccount,
    LogInDialog,
    KeyList,
    SchemeFilter,
    ReviewList,
    UserHeader,
    LogOut
  },
  data() {
    return {
      counts: { null: 0 }
    }
  },
  computed: {
    reviewCount() {
      return this.counts.null
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    load() {
      this.counts = this.$store.getters.reviewsAndCounts({
        kid: this.$store.state.publicKey
      }).counts
    }
  },
  middleware: 'account'
}
</script>
