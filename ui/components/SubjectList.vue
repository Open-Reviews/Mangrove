<template>
  <v-container>
    <v-list v-if="subjects.length" three-line>
      <template v-for="(subject, i) in subjectArgs">
        <v-list-item
          :key="subject.sub"
          @click="select(subject)"
          :class="subject.sub === $route.query.sub ? 'active-item' : ''"
          hover
          style="align-items: start"
        >
          <div style="min-width: 140px">
            <v-chip class="ma-3">
              <v-icon v-text="subject.icon" small class="mr-1" />
              {{ subject.name }}
            </v-chip>
          </div>
          <v-list-item-content>
            <v-list-item-title>{{ subject.title }}</v-list-item-title>
            <v-row align="center" class="ml-auto pt-2">
              <v-rating
                :value="subject.stars"
                :background-color="
                  subject.quality ? 'primary' : 'grey lighten-2'
                "
                readonly
                half-increments
                dense
                class="mr-2"
              />
              {{ subject.stars && subject.stars.toFixed(1) }}
              <span
                :class="subject.quality ? 'ml-1' : 'grey--text text--lighten-2'"
                >({{ subject.count }})</span
              >
            </v-row>
            <v-list-item-subtitle class="text--primary">{{
              subject.subtitle
            }}</v-list-item-subtitle>
            <v-list-item-subtitle v-html="subject.description" />
          </v-list-item-content>
          <v-list-item-avatar
            v-if="subject.image"
            min-height="120"
            min-width="90"
            tile
          >
            <v-img
              :src="subject.image"
              min-height="120"
              min-width="90"
              class="elevation-3"
            />
          </v-list-item-avatar>
        </v-list-item>
        <v-divider :key="i" />
      </template>
    </v-list>
    <div v-else-if="$store.state.isSearching" v-html="searchingContent" />
    <div v-else v-html="missingContent" class="text-center my-3" />
    <div v-if="showAdvice" class="mx-12">
      <v-expansion-panels class="elevation-0 mt-1">
        <v-expansion-panel>
          <v-expansion-panel-header>
            <span class="text-center">
              Can’t find what you were looking for?
            </span>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <div
              v-for="advice in adviceContent"
              :key="advice.title"
              class="body-2"
            >
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
            <v-row justify="space-around">
              <v-btn
                v-for="button in adviceButtons"
                :href="button.action"
                :key="button.label"
                target="_blank"
                >{{ button.label }}</v-btn
              >
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </v-container>
</template>

<script>
import { NAMES, ICONS } from '~/store/scheme-types'
import { SET_SEARCH_RESULTS_AS_READ } from '../store/mutation-types'
export default {
  data() {
    return {
      searchingContent: `Results loading...`,
      missingContent: `No results found.`,
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
              description: `try entering the exact legal name (e.g., BASF SE);
                you can search for the exact name of the entity you'd like to review in GLEIF's <a href="https://search.gleif.org/#/search/">Legal Entity Identifier</a> database that Mangrove uses for company identifiers`
            },
            {
              subtitle: 'Books',
              description: `try adding the author, subtitle, or searching by ISBN;
                you can check out the <a href="https://openlibrary.org/">Open Library</a> database to see if the book you are searching for has been entered already; Mangrove uses this open database for book identifiers`
            },
            {
              subtitle: 'Websites',
              description: 'enter the complete URL, e.g., https://example.com'
            }
          ]
        },
        {
          title:
            'Add a missing entry to the open datasets that Mangrove uses to provide unique identifiers:',
          bullets: [
            {
              subtitle: 'Restaurants, hotels, local businesses',
              description:
                '<a href="https://learnosm.org/en/beginner/start-osm/">contribute data to OpenStreetMap</a>'
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
            'mailto:hello@open-reviews.net?subject=Missing Review Subject on Mangrove'
        }
      ] 
    }
  },
  computed: {
    subjects() {
      const selected = this.$store.getters.subject(this.$route.query.sub)
      const all =
        !this.$route.query.q && selected
          ? [selected]
          : this.$store.state.searchResults
              .map((uri) => this.$store.state.subjects[uri])
              .filter(Boolean)
      const list = this.$store.state.filter
        ? all.filter((subject) => this.$store.state.filter === subject.scheme)
        : all
      const sorted = list.sort(
        (s1, s2) =>
          (s2.quality || s2.importance) - (s1.quality || s1.importance)
      )
      // Select first subject after done searching if one is not selected.
      const routeSub = this.$route.query.sub
      if (
        // Once searching is done.
        !this.$store.state.isSearching &&
        // Select if no sub in route or if the sub in route is different.
        (!routeSub || routeSub !== this.$store.state.query.sub) &&
        // Prevent this from being triggered without a search completetion
        !this.$store.state.searchResultsRead
      ) {

        const selected = routeSub || (sorted[0] && sorted[0].sub)
        if (selected) {
          this.$store.dispatch('selectSubject', [this.$route.query, selected])
          this.$store.commit(SET_SEARCH_RESULTS_AS_READ)
        }
      }
      return sorted
    },
    showAdvice() {
      console.log('isSearching: ', this.$store.state.isSearching)
      return !this.$store.state.isSearching
    },
    subjectArgs() {
      return this.subjects.map((subject) => {
        subject.name = NAMES[subject.scheme]
        subject.icon = ICONS[subject.scheme]
        subject.stars = subject.quality && (subject.quality + 25) / 25
        return subject
      })
    }
  },
  methods: {
    select(subject) {
      this.$emit('selected')
      this.$store.dispatch('selectSubject', [this.$route.query, subject.sub])
    }
  }
}
</script>

<style scoped>
.active-item {
  background: var(--v-secondary-base);
}
</style>
