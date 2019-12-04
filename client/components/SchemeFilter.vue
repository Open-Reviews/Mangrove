<template>
  <v-row justify="space-around">
    <v-checkbox
      v-for="box in boxes"
      :key="box.var"
      v-model="filters"
      :value="box.var"
      :label="box.label"
      multiple
    />
    <v-btn v-on:click="filters = []">Clear filters</v-btn>
  </v-row>
</template>

<script>
import { SET_FILTERS } from '../store/mutation-types'

export default {
  data() {
    return {
      boxes: [
        { var: 'geo', label: 'Places on map' },
        { var: 'urn:lei', label: 'Companies' },
        { var: 'https', label: 'Websites' },
        { var: 'urn:isbn', label: 'Books' }
      ]
    }
  },
  computed: {
    filters: {
      get() {
        return this.$store.state.filters
      },
      set(value) {
        this.$store.commit(SET_FILTERS, value)
      }
    }
  }
}
</script>
