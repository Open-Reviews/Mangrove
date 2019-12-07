<template>
  <v-container>
    <v-card
      v-for="sub in subjects"
      :key="sub.sub"
      @click="select(sub)"
      :ripple="false"
      active-class="event"
      class="my-4"
      hover
    >
      <v-row align="center">
        <v-col>
          <v-chip small label>
            {{ name(sub.scheme) }}
          </v-chip>
          <v-card-title>{{ sub.title }}</v-card-title>
          <v-row align="center" class="ma-auto">
            <v-rating v-model="sub.aggregateRating" dense />
            {{ sub.aggregateRating }}
            ({{ sub.aggregateReviews }})
          </v-row>
          <v-card-subtitle>{{ sub.subtitle }}</v-card-subtitle>
          <v-card-text>{{ sub.description }}</v-card-text>
        </v-col>
        <v-col v-if="sub.image">
          <v-avatar class="profile" tile height="150" width="100">
            <v-img :src="sub.image" />
          </v-avatar>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
import { NAMES } from '../store/scheme-types'
import { SELECT_SUB } from '../store/mutation-types'
export default {
  computed: {
    filters() {
      return this.$store.state.filters
    },
    subjects() {
      return this.$store.state.subjects.filter((subject) => {
        return (
          !this.filters.length ||
          this.filters.some((filter) => subject.scheme === filter)
        )
      })
    }
  },
  methods: {
    select(subject) {
      this.$store.dispatch('saveReviews', { sub: subject.sub })
      this.$store.commit(SELECT_SUB, subject)
    },
    name(uri) {
      return NAMES[uri]
    }
  }
}
</script>
