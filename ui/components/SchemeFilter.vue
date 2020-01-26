<template>
  <v-row justify="space-around" class="ma-auto">
    <v-checkbox
      v-for="box in boxes"
      :key="box.var"
      v-model="filters"
      :value="box.var"
      :label="box.label"
      :class="{ 'body-2': $vuetify.breakpoint.smAndDown }"
      multiple
    />
  </v-row>
</template>

<script>
import { SET_FILTERS } from '../store/mutation-types'
import { GEO, LEI, HTTPS, ISBN } from '../store/scheme-types'

export default {
  data() {
    return {
      boxes: [
        { var: GEO, label: 'Places' },
        { var: LEI, label: 'Companies' },
        { var: HTTPS, label: 'Websites' },
        { var: ISBN, label: 'Books' }
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
