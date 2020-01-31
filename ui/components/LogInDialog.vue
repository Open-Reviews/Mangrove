<template>
  <v-dialog width="600">
    <template v-slot:activator="{ on }">
      <v-btn v-on="on">Log in</v-btn>
    </template>
    <v-card>
      <v-card-title>
        Log in
      </v-card-title>
      <LogIn />
    </v-card>
  </v-dialog>
</template>

<script>
import LogIn from './LogIn'

export default {
  components: {
    LogIn
  }
}
</script>
