<template>
  <v-dialog v-model="dialog" width="600">
    <template v-slot:activator="{ on }">
      <a v-if="text" v-on="on">Log in</a>
      <v-btn v-else v-on="on">Log in</v-btn>
    </template>
    <v-card>
      <v-card-title>
        Log in
      </v-card-title>
      <LogIn @success="dialog = false" />
    </v-card>
  </v-dialog>
</template>

<script>
import LogIn from './LogIn'

export default {
  components: {
    LogIn
  },
  props: {
    text: Boolean
  },
  data() {
    return {
      dialog: false
    }
  }
}
</script>
