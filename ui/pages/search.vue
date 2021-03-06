<template>
  <v-row style="margin-top: 0px">
    <v-col
      :cols="isBig ? 5 : ''"
      v-if="isBig || !viewProfile"
      class="scrollable noscroll mr-n3"
      style="background: white; padding-top: 24px"
    >
      <v-row class="px-10">
        <SearchBox />
        <SchemeFilter @geo="geoLoc" class="mt-n6" />
      </v-row>
      <SelectionMap
        v-if="!isBig"
        :selected="selected && selected.coordinates"
        :points="$store.getters.mapPoints()"
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
        <v-btn @click.stop="viewProfile = false" class="mt-2" v-if="!isBig">
          <v-icon>mdi-arrow-left-bold</v-icon>
          Back to list
        </v-btn>
      </v-row>
      <SubjectProfile>
        <SelectionMap
          :selected="selected && selected.coordinates"
          :points="$store.getters.mapPoints()"
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
import SchemeFilter from '~/components/SchemeFilter'

const LAT_BOX = 0.1
const LON_BOX = 0.1

function getLocation() {
  if (!navigator.geolocation) return
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('GOT LOCATION')
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        resolve([lon - LON_BOX, lat - LAT_BOX, lon + LON_BOX, lat + LAT_BOX])
      },
      (error) => console.log('No location: ', error)
    )
  })
}

export default {
  components: {
    SearchBox,
    SubjectList,
    SubjectProfile,
    SelectionMap,
    SchemeFilter
  },
  head() {
    return {
      title: 'Search',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'Search for a reviewable subject, e.g. a restaurant, coffee place, product.'
        }
      ]
    }
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
    async geoLoc() {
      const box = await getLocation()
      if (box) this.geoSearch(box)
    },
    geoSearch(coordinates) {
      const geo = coordinates.join(',')
      console.log('Map query: ', geo)
      this.$router.push({
        path: 'search',
        query: {
          [GEO]: geo,
          q: this.$route.query.q
        }
      })
    }
  },
  middleware: 'search'
}
</script>

<style scoped>
.scrollable {
  height: 95vh;
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
