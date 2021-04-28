<template>
  <v-row justify="space-around" class="ma-auto">
    <v-chip-group v-model="filter" column>
      <v-tooltip
        v-for="box in boxes"
        :key="box.var"
        :disabled="error !== box.scheme"
        bottom
      >
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-chip
              :value="box.scheme"
              :class="{ 'body-2': $vuetify.breakpoint.smAndDown }"
              :outlined="filter !== box.scheme"
              :disabled="error === box.scheme || (comments && !box.count)"
            >
              <v-avatar v-if="box.icon"
                ><v-icon v-text="box.icon" small
              /></v-avatar>
              {{ box.label }} {{ box.count }}
            </v-chip>
          </div>
        </template>
        <span>{{ errorMessage }}</span>
      </v-tooltip>
    </v-chip-group>
  </v-row>
</template>

<script>
import { SET_FILTER } from '../store/mutation-types'
import {
  ICONS,
  pluralName,
  errorString,
  MARESI,
  GEO
} from '~/store/scheme-types'

export default {
  props: {
    comments: Boolean,
    counts: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  computed: {
    boxes() {
      const obj = [
        { var: null, label: 'All', icon: null, count: this.counts.null }
      ]
      for (const [scheme, icon] of Object.entries(ICONS)) {
        if (this.comments || scheme !== MARESI)
          obj.push({
            scheme,
            icon,
            label: pluralName(scheme),
            count: this.counts[scheme]
          })
      }
      return obj
    },
    filter: {
      get() {
        return this.$store.state.filter || 0
      },
      set(value) {
        if (value === GEO) {
          this.$emit(GEO)
        }
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
