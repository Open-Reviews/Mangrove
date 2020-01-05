<template>
  <v-container>
    <div v-if="subjects.length">
      <v-card
        v-for="subject in subjects"
        :key="subject.sub"
        @click="select(subject.sub)"
        :ripple="false"
        :color="subject.sub === $route.query.sub ? 'success' : 'white'"
        class="my-4"
        hover
      >
        <v-row align="center">
          <v-col>
            <v-chip small label class="mx-3">
              {{ name(subject.scheme) }}
            </v-chip>
            <v-card-title>{{ subject.title }}</v-card-title>
            <v-row align="center" class="mx-4 my-n4">
              <v-rating :value="subject.quality" readonly dense class="mr-2" />
              {{ subject.quality }}
              ({{ subject.count }})
            </v-row>
            <v-card-subtitle>{{ subject.subtitle }}</v-card-subtitle>
            <v-card-text v-html="subject.description" />
          </v-col>
          <v-col v-if="subject.image" cols="4">
            <v-img :src="subject.image" class="mr-5" />
          </v-col>
        </v-row>
      </v-card>
    </div>
    <div v-else-if="$store.state.isSearching" v-html="searchingContent" />
    <div v-else v-html="missingContent" />
    <div v-if="showAdvice">
      <br />
      <h1>Can’t find what you were looking for?</h1>
      <div v-for="advice in adviceContent" :key="advice.title">
        <b>{{ advice.title }}</b>
        <ul>
          <li v-for="bullet in advice.bullets" :key="bullet.subtitle">
            <b>{{ bullet.subtitle }}</b
            >:
            <span v-html="bullet.description" />
          </li>
        </ul>
        <br />
      </div>
      <v-row>
        <v-btn
          v-for="button in adviceButtons"
          :href="button.action"
          :key="button.label"
          target="_blank"
          >{{ button.label }}</v-btn
        >
      </v-row>
    </div>
  </v-container>
</template>

<script>
import { NAMES } from '../store/scheme-types'
export default {
  data() {
    return {
      searchingContent: `Results loading...`,
      missingContent: `No review subjects found.`,
      adviceContent: [
        {
          title: 'Try making your search more specific:',
          bullets: [
            {
              subtitle: 'Restaurants, hotels, local businesses',
              description: `zoom in on the map and click “Search selected area”,
                or add the street address in the search`
            },
            {
              subtitle: 'Companies',
              description: `add the country or street (please note that company search
                is based on the open GLEIF database that contains companies with
                a “Legal Entity Identifier” (LEI)`
            },
            {
              subtitle: 'Books',
              description: 'try adding or searching by author or ISBN'
            },
            {
              subtitle: 'Websites',
              description: 'enter the complete URL, e.g., https://example.com'
            }
          ]
        },
        {
          title: 'Add a missing entry to the underlying datasets:',
          bullets: [
            {
              subtitle: 'Restaurants, hotels, local businesses',
              description:
                '<a href="https://learnosm.org/en/beginner/start-osm/">contribute data points to OpenStreetMap</a>'
            },
            {
              subtitle: 'Books',
              description:
                '<a href="https://openlibrary.org/">contribute data to Internet Archive’s Open Library</a>'
            }
          ]
        }
      ],
      adviceButtons: [
        {
          label: 'Write us',
          action:
            'mailto:hello@planting.space?subject=Missing Review Subject on Mangrove'
        }
      ]
    }
  },
  computed: {
    filters() {
      return this.$store.state.filters
    },
    subjects() {
      const all = Object.values(this.$store.state.subjects)
      const list = this.filters.length
        ? all.filter((subject) =>
            this.filters.some((filter) => {
              const accepted = subject.scheme === filter
              return accepted
            })
          )
        : all
      const sorted = list.sort(
        (s1, s2) =>
          (s2.importance || s2.quality) - (s1.importance || s1.quality)
      )
      // Select first subject after done searching if one is not selected.
      if (!this.$store.state.isSearching && !this.$route.query.sub) {
        const first = sorted[0]
        if (first && first.sub) {
          this.$store.dispatch('selectSubject', [this.$route.query, first.sub])
        }
      }
      return sorted
    },
    showAdvice() {
      console.log('isSearching: ', this.$store.state.isSearching)
      return !this.$store.state.isSearching
    }
  },
  methods: {
    name(uri) {
      return NAMES[uri]
    },
    select(sub) {
      this.$store.dispatch('selectSubject', [this.$route.query, sub])
    }
  }
}
</script>
