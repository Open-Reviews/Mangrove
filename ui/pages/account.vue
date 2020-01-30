<template>
  <v-container style="max-width: 1200px">
    <v-row>
      <v-col>
        <Account />
        <v-container>
          <h2>Preferences</h2>
          <v-checkbox v-model="$vuetify.theme.dark" label="Dark mode" />
        </v-container>
      </v-col>
      <v-col>
        <YourReviews />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Account from '~/components/Account'
import YourReviews from '~/components/YourReviews'

export default {
  components: {
    Account,
    YourReviews
  },
  middleware: 'clear'
}
</script>
