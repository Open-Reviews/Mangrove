<template>
  <v-container>
    <h1>Learn here how to make the best out of Mangrove</h1>
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
            title: 'For Reviewers',
            subtitle: 'Share your insights',
            bullets: [
              'Read the reviewer’s guide',
              'Manage your account',
              'See your reviews'
            ]
          },
          {
            title: 'For Businesses with reviews',
            subtitle: 'Manage your reputation',
            bullets: [
              'Learn how to best engage with your users',
              'Embed your reviews in your website and outreach',
              'Verify yourself at business owner'
            ]
          }
        ],
        [
          {
            title: 'For general Users',
            subtitle: 'Use the data set',
            bullets: [
              'Search, read, and analyse opinions and sentiments',
              'Download the dataset',
              'Host the database'
            ]
          },
          {
            title: 'For Entrepreneurs',
            subtitle: 'Build something great',
            bullets: [
              'Build new services and products on the dataset',
              'Check out APIs and documentation',
              'Download the dataset'
            ]
          }
        ]
      ]
    }
  }
}
</script>
