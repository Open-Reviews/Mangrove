<template>
  <v-row>
    <v-col>
      <Account />
    </v-col>
    <v-col>
      <YourReviews />
    </v-col>
  </v-row>
</template>

<script>
import Account from '../components/Account'
import YourReviews from '../components/YourReviews'

export default {
  components: {
    Account,
    YourReviews
  }
}
</script>
