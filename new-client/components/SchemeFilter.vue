<template>
  <v-row justify="space-around">
    <v-checkbox v-model="all" label="Show all" />
    <v-checkbox v-model="places" label="Places on map" />
    <v-checkbox v-model="companies" label="Companies" />
    <v-checkbox v-model="websites" label="Websites" />
    <v-checkbox v-model="books" label="Books" />
  </v-row>
</template>

<script>
export default {
  data() {
    return {
      all: false,
      places: false,
      companies: false,
      websites: false,
      books: false
    }
  }
}
</script>
