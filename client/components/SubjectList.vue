<template>
  <v-container>
    <v-card
      v-for="subject in subjects"
      :key="subject.sub"
      @click="select(subject.sub)"
      :ripple="false"
      active-class="event"
      class="my-4"
      hover
    >
      <v-row align="center">
        <v-col>
          <v-chip small label class="mx-3">
            {{ name(subject.scheme) }}
          </v-chip>
          <v-card-title>{{ subject.title }}</v-card-title>
          <v-row v-if="subject.count" align="center" class="mx-4 mt-n4">
            <v-rating v-model="subject.quality" dense />
            {{ subject.quality }}
            ({{ subject.count }})
          </v-row>
          <v-row v-else align="center" class="mx-4 mt-n4">
            No reviews
          </v-row>
          <v-card-subtitle>{{ subject.subtitle }}</v-card-subtitle>
          <v-card-text>{{ subject.description }}</v-card-text>
        </v-col>
        <v-col v-if="subject.image">
          <v-avatar class="profile" tile height="150" width="100">
            <v-img :src="subject.image" />
          </v-avatar>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
import { NAMES, MARESI } from '../store/scheme-types'
export default {
  computed: {
    filters() {
      return this.$store.state.filters
    },
    subjects() {
      const all = Object.values(this.$store.state.subjects).filter(
        (subject) => subject.scheme !== MARESI
      )
      return this.filters.length
        ? all.filter((subject) =>
            this.filters.some((filter) => subject.scheme === filter)
          )
        : all
    }
  },
  methods: {
    select(sub) {
      console.log('Selecting subject: ', sub)
      this.$router.push({
        path: 'search',
        query: { q: this.$route.query.q, sub }
      })
      this.$store.dispatch('saveReviews', { sub })
    },
    name(uri) {
      return NAMES[uri]
    }
  }
}
</script>
