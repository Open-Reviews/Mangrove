<template>
  <v-dialog v-model="dialog" width="600">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on">Log out</v-btn>
    </template>
    <v-card>
      <v-card-title>
        Log out
      </v-card-title>
      <v-card-text v-text="explanation" />
      <v-card-actions>
        <v-spacer />
        <v-btn @click.stop="dialog = false">Go back</v-btn>
        <v-btn @click.stop="logout">Log out</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { set } from 'idb-keyval'
import { PRIVATE_KEY, HAS_SAVED_KEY } from '~/store/indexeddb-types'

export default {
  data() {
    return {
      dialog: false,
      explanation: 'Save your pass and youll get a new account'
    }
  },
  methods: {
    async logout() {
      await set(PRIVATE_KEY, null)
      await set(HAS_SAVED_KEY, null)
      await this.$store.dispatch('generateKeypair')
      this.dialog = false
    }
  }
}
</script>
