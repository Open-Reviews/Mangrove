<template>
  <v-container>
    <h1>Contribute TODO</h1>
    <v-row v-for="row in content" :key="row[0].title">
      <v-col v-for="item in row" :key="item.title">
        <v-card>
          <v-card-title>{{ item.title }}</v-card-title>
          <v-card-subtitle>{{ item.subtitle }}</v-card-subtitle>
          <v-card-text>
            <ul>
              <li v-for="bullet in item.bullets" :key="bullet">{{ bullet }}</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      dumpUrl: `${process.env.VUE_APP_API_URL}/request`,
      content: [
        [
          {
            title: 'For reviewers',
            subtitle: 'Share your insights',
            bullets: []
          },
          {
            title: 'For subjects of reviews',
            subtitle:
              'Local businesses and places on the map, companies, websites, book authors',
            bullets: []
          }
        ],
        [
          {
            title: 'For users',
            subtitle: 'Using the data set',
            bullets: []
          },
          {
            title: 'For entrepreneurs',
            subtitle: 'Build something greatShare your insights',
            bullets: []
          }
        ]
      ]
    }
  }
}
</script>
