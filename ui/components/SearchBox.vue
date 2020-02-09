<template>
  <v-container justify="center">
    <v-row>
      <v-text-field
        v-on:keyup.enter="search"
        v-model.trim="query"
        :placeholder="placeholder"
        @click:append="search"
        @focus="$emit('focus', true)"
        @blur="$emit('focus', false)"
        append-icon="mdi-magnify"
        filled
        outlined
        background-color="white"
        dense
      />
    </v-row>
  </v-container>
</template>

<script>
import { GEO } from '~/store/scheme-types'

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
        resolve(
          [lon - LON_BOX, lat - LAT_BOX, lon + LON_BOX, lat + LAT_BOX].join(',')
        )
      },
      (error) => console.log('No location: ', error)
    )
  })
}

export default {
  props: {
    noFilter: Boolean
  },
  data() {
    return {
      query: '',
      placeholderIndex: 0,
      placeholders: [
        'Try ‘restaurants in Zurich’ or ‘The Wellington in London',
        'Try ‘quora.com’ or ‘upwork.com’',
        'Try ‘The Age of Surveillance Capitalism’',
        'Try ‘Siemens in Germany’'
      ]
    }
  },
  computed: {
    placeholder() {
      return this.placeholders[this.placeholderIndex]
    }
  },
  mounted() {
    window.setInterval(() => {
      this.nextPlaceholder()
    }, 2000)
    this.query = this.$route.query.q
  },
  methods: {
    async search() {
      if (this.query && this.query.length > 0) {
        const query = { q: this.query }
        const box = await getLocation()
        if (box) query[GEO] = box
        this.$router.push({ path: 'search', query })
      }
    },
    nextPlaceholder() {
      this.placeholderIndex =
        (this.placeholderIndex + 1) % this.placeholders.length
    }
  }
}
</script>
