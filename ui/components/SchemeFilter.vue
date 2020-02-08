<template>
  <v-row justify="space-around" class="ma-auto">
    <v-chip-group v-model="filter" column>
      <v-tooltip v-for="box in boxes" :key="box.var" bottom>
        <template v-slot:activator="{ on }">
          <v-chip
            :value="box.scheme"
            :class="{ 'body-2': $vuetify.breakpoint.smAndDown }"
            :outlined="filter !== box.scheme"
            :disabled="error === box.scheme"
            v-on="error && on"
          >
            <v-avatar v-if="box.icon"
              ><v-icon v-text="box.icon" small
            /></v-avatar>
            {{ box.label }}
          </v-chip>
        </template>
        <span>{{ errorMessage }}</span>
      </v-tooltip>
    </v-chip-group>
  </v-row>
</template>

<script>
import { SET_FILTER } from '../store/mutation-types'
import { ICONS, pluralName, errorString, MARESI } from '~/store/scheme-types'

export default {
  props: {
    comments: Boolean,
    count: { type: Number, default: () => null },
    schemeCounts: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  computed: {
    boxes() {
      const obj = [{ var: null, label: 'All', icon: null, count: this.count }]
      for (const [scheme, icon] of Object.entries(ICONS)) {
        if (this.comments || scheme !== MARESI)
          obj.push({
            scheme,
            icon,
            label: pluralName(scheme),
            count: this.schemeCounts[scheme]
          })
      }
      return obj
    },
    filter: {
      get() {
        return this.$store.state.filter
      },
      set(value) {
        this.$store.commit(SET_FILTER, value)
      }
    },
    error() {
      return this.$store.state.errors.search
    },
    errorMessage() {
      return errorString(this.error)
    }
  }
}
</script>
