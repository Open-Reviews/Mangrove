<template>
  <v-container>
    <h1>Making the best out of Mangrove!</h1>
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
    <a :href="dumpUrl">Get all Mangrove data</a>
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
            bullets: [
              'Reviewer’s guideline',
              'Manage your account',
              'See your reviews'
            ]
          },
          {
            title: 'For subjects of reviews',
            subtitle:
              'Local businesses and places on the map, companies, websites, book authors',
            bullets: [
              'Engage with your users',
              'Embed your reviews in your website or outreach'
            ]
          }
        ],
        [
          {
            title: 'For users',
            subtitle: 'Using the data set',
            bullets: [
              'Search, read, and analyse opinions and sentiments',
              'Download the database',
              'Host the database'
            ]
          },
          {
            title: 'For entrepreneurs',
            subtitle: 'Build something greatShare your insights',
            bullets: [
              'Build new services and products on the dataset',
              'APIs and documentation',
              'Download the dataset'
            ]
          }
        ]
      ]
    }
  }
}
</script>
