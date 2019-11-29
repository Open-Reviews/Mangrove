<template>
  <v-container>
    <v-row justify="center">
      <span class="text-center">
        <h1>Read review. Write reviews.</h1>
        <br />
        Find places, companies, websites, books.
      </span>
    </v-row>
    <SearchBox />
    <v-row>
      <v-col v-for="feature in features" :key="feature.title">
        <v-card>
          <v-card-title>{{ feature.title }}</v-card-title>
          <v-card-text v-for="detail in feature.details" :key="detail">
            {{ detail }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SearchBox from './SearchBox'

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
            'Read and write reviews for places, websites, companies, and books',
            'Get informed before making decisions and share your insights with others',
            'Do research and build useful applications on this valuable data'
          ]
        },
        {
          title: 'Open data',
          details: [
            'The content you provide is under a free and open license, and not kept proprietary',
            'Your contribution can be leveraged by researchers, entrepreneurs, and end-users alike, without posing barriers to entry for anyone'
          ]
        },
        {
          title: 'Privacy',
          details: [
            'You are in full control of what information you want to publish and share',
            'Mangrove does not track you or collect information about you',
            'You control under what identity you publish your insights'
          ]
        }
      ]
    }
  }
}
</script>
