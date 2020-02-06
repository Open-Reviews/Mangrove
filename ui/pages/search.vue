<template>
  <v-row>
    <v-col
      :cols="isBig ? 5 : ''"
      v-if="isBig || !viewProfile"
      class="scrollable noscroll mr-n3"
    >
      <v-row class="px-10">
        <SearchBox />
      </v-row>
      <SelectionMap
        v-if="!isBig"
        :selected="selected && selected.coordinates"
        :points="$store.getters.mapPoints"
        @select="selectSubject($event)"
        @search="geoSearch($event)"
      />
      <v-row>
        <SubjectList @selected="viewProfile = true" />
      </v-row>
    </v-col>
    <v-divider v-if="isBig" vertical />
    <v-col
      v-if="isBig || viewProfile"
      style="padding-left: 7vw; padding-right: 7vw"
      class="scrollable noscroll"
    >
      <v-row justify="center">
        <v-btn @click.stop="viewProfile = false" v-if="!isBig">
          <v-icon>mdi-arrow-left-bold</v-icon>
          Back to list
        </v-btn>
      </v-row>
      <SubjectProfile>
        <SelectionMap
          :selected="selected && selected.coordinates"
          :points="$store.getters.mapPoints"
          @select="selectSubject($event)"
          @search="geoSearch($event)"
        />
      </SubjectProfile>
    </v-col>
  </v-row>
</template>

<script>
import { SEARCH_ERROR } from '~/store/mutation-types'
import { GEO } from '~/store/scheme-types'
import SearchBox from '~/components/SearchBox'
import SubjectList from '~/components/SubjectList'
import SubjectProfile from '~/components/SubjectProfile'
import SelectionMap from '~/components/SelectionMap'

export default {
  components: {
    SearchBox,
    SubjectList,
    SubjectProfile,
    SelectionMap
  },
  data() {
    return {
      viewProfile: false
    }
  },
  computed: {
    isBig() {
      return this.$vuetify.breakpoint.mdAndUp
    },
    selected() {
      return this.$store.getters.subject(this.$route.query.sub)
    }
  },
  destroyed() {
    this.$store.commit(SEARCH_ERROR, null)
  },
  methods: {
    selectSubject(sub) {
      if (sub && this.$route.query.sub !== sub) {
        this.viewProfile = true
        this.$store.dispatch('selectSubject', [this.$route.query, sub])
      }
    },
    geoSearch(coordinates) {
      const geo = coordinates.join(',')
      console.log('Map query: ', geo)
      this.$router.push({
        path: 'search',
        query: {
          [GEO]: geo,
          q: this.$route.query.q,
          sub: this.$route.query.sub
        }
      })
    }
  },
  middleware: 'search'
}
</script>

<style scoped>
.scrollable {
  height: 100vh;
}
.noscroll {
  overflow-y: scroll;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}
.noscroll::-webkit-scrollbar {
  /* WebKit */
  width: 0;
  height: 0;
}
</style>
