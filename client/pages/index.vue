<template>
  <v-container>
    <v-row justify="center">
      <span class="text-center">
        <h1 class="display-3">Read reviews. Write reviews.</h1>
        <br />
        <span class="display-1"
          >Find places, companies, websites, or books.</span
        >
      </span>
    </v-row>
    <v-row class="mb-5">
      <SearchBox />
    </v-row>
    <v-row>
      <v-col v-for="feature in features" :key="feature.title">
        <v-card min-height="400">
          <v-card-title>{{ feature.title }}</v-card-title>
          <v-card-text v-for="detail in feature.details" :key="detail">
            {{ detail }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-dialog v-model="$store.state.alphaWarning" max-width="500">
      <v-card>
        <v-card-title>
          This is a DEMO version
        </v-card-title>

        <v-card-text>
          A warm Welcome to Mangrove from Dina and Peter. Please note that this
          is a DEMO version of the Mangrove service. Its purpose is to allow you
          to test the basic functionality and to give us feedback. Please check
          out the About page for current and future features.
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dismissAlphaWarning" text>
            Ok, got it
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { DISMISS_ALPHA_WARNING } from '../store/mutation-types'
import SearchBox from '../components/SearchBox'

export default {
  components: {
    SearchBox
  },
  data() {
    return {
      features: [
        {
          title: 'Valuable insights',
          details: [
            'Read and write reviews for places, websites, companies, and books.',
            'Get informed before making decisions and share your insights with others.',
            'Do research, or build useful applications. Get feedback from your customers and interact with them.'
          ]
        },
        {
          title: 'Open data',
          details: [
            'The content you provide is under a free and open license, and cannot be kept proprietary.',
            'Your contribution can be leveraged by researchers, entrepreneurs, and end-users alike, without posing barriers to entry for anyone',
            'Make businesses compete based on technological merit, not on access to data.'
          ]
        },
        {
          title: 'Privacy',
          details: [
            'You are in full control of what information you share. Mangrove does not track you or collect information about you.',
            'Use Mangrove without a registration or login process.',
            'Help spread privacy-preserving technologies.'
          ]
        }
      ]
    }
  },
  methods: {
    dismissAlphaWarning() {
      this.$store.commit(DISMISS_ALPHA_WARNING)
    }
  },
  middleware: 'clear'
}
</script>
