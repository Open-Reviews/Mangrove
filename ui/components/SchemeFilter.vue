<template>
  <v-row justify="space-around" class="ma-auto">
    <v-chip-group v-model="filter" column>
      <v-chip
        v-for="box in boxes"
        :key="box.var"
        :value="box.var"
        :class="{ 'body-2': $vuetify.breakpoint.smAndDown }"
        :outlined="filter !== box.var"
      >
        <v-avatar v-if="box.var"
          ><v-icon v-text="icon(box.var)" small
        /></v-avatar>
        {{ box.label }}
      </v-chip>
    </v-chip-group>
  </v-row>
</template>

<script>
import { SET_FILTER } from '../store/mutation-types'
import { GEO, LEI, HTTPS, ISBN, ICONS } from '~/store/scheme-types'

export default {
  data() {
    return {
      boxes: [
        { var: null, label: 'All' },
        { var: GEO, label: 'Places' },
        { var: LEI, label: 'Companies' },
        { var: HTTPS, label: 'Websites' },
        { var: ISBN, label: 'Books' }
      ]
    }
  },
  computed: {
    filter: {
      get() {
        return this.$store.state.filter
      },
      set(value) {
        this.$store.commit(SET_FILTER, value)
      }
    }
  },
  methods: {
    icon(uri) {
      return ICONS[uri]
    }
  }
}
</script>
