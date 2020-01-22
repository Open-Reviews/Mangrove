<template>
  <v-container>
    <v-list v-if="subjects.length" three-line>
      <template v-for="(subject, i) in subjects">
        <v-list-item
          :key="subject.sub"
          @click="select(subject.sub)"
          :input-value="subject.sub === $route.query.sub"
          color="success"
          hover
          style="align-items: start"
        >
          <v-chip small label class="ma-3" style="min-width: 80px">
            {{ name(subject.scheme) }}
          </v-chip>
          <v-list-item-content>
            <v-list-item-title>{{ subject.title }}</v-list-item-title>
            <v-row align="center" class="ml-auto">
              <v-rating
                :value="subject.quality"
                readonly
                half-increments
                dense
                class="mr-2"
              />
              {{ subject.quality }}
              ({{ subject.count }})
            </v-row>
            <v-list-item-subtitle class="text--primary">{{
              subject.subtitle
            }}</v-list-item-subtitle>
            <v-list-item-subtitle v-html="subject.description" />
          </v-list-item-content>
          <v-list-item-avatar
            v-if="subject.image"
            min-height="10vh"
            min-width="7vh"
            tile
          >
            <v-img
              :src="subject.image"
              min-height="10vh"
              min-width="7vh"
              class="elevation-3"
            />
          </v-list-item-avatar>
        </v-list-item>
        <v-divider :key="i" />
      </template>
    </v-list>
    <div v-else-if="$store.state.isSearching" v-html="searchingContent" />
    <div v-else v-html="missingContent" />
    <div v-if="showAdvice">
      <div class="text-center">
        No more results found for this search criteria
      </div>
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
      <v-row justify="space-around">
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
import { NAMES, MARESI } from '~/store/scheme-types'
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
      const selected = this.$store.getters.subject(this.$route.query.sub)
      const all =
        !this.$route.query.q && selected
          ? [selected]
          : Object.values(this.$store.state.subjects).filter(
              (subject) => subject.scheme !== MARESI
            )
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
          (s2.quality || s2.importance) - (s1.quality || s1.importance)
      )
      // Select first subject after done searching if one is not selected.
      const routeSub = this.$route.query.sub
      if (
        // Once searching is done.
        !this.$store.state.isSearching &&
        // Select if no sub in route or if the sub in route is different.
        (!routeSub || routeSub !== this.$store.state.query.sub)
      ) {
        const selected = routeSub || (sorted[0] && sorted[0].sub)
        if (selected) {
          this.$store.dispatch('selectSubject', [this.$route.query, selected])
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
