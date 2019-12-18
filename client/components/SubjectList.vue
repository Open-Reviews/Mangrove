<template>
  <v-container>
    <div v-if="subjects.length">
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
            <v-card-text v-html="subject.description" />
          </v-col>
          <v-col v-if="subject.image">
            <v-avatar class="profile" tile height="150" width="100">
              <v-img :src="subject.image" />
            </v-avatar>
          </v-col>
        </v-row>
      </v-card>
    </div>
    <div v-else v-html="missingContent" />
  </v-container>
</template>

<script>
import { NAMES, MARESI } from '../store/scheme-types'
export default {
  data() {
    return { missingContent: 'No review subjects found.' }
  },
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
            this.filters.some((filter) => {
              const accepted = subject.scheme === filter
              if (!accepted && subject.sub === this.$route.query.sub) {
              }
              return accepted
            })
          )
        : all
    }
  },
  methods: {
    name(uri) {
      return NAMES[uri]
    },
    select(sub) {
      console.log('SubjectList')
      this.$store.dispatch('selectSubject', [this.$route.query.q, sub])
    }
  }
}
</script>
