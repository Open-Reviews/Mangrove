<template>
  <v-container>
    <span class="text-center">
      <h1 v-text="title" class="display-3 my-5" />
      <br />
      <h2 v-text="subtitle" class="display-1" />
    </span>
    <v-row class="my-7">
      <v-col v-for="section in content" :key="section.title">
        <v-card min-height="350" min-width="300">
          <v-row justify="center">
            <v-icon x-large class="ma-12">{{ section.icon }}</v-icon>
          </v-row>
          <v-divider />
          <v-card-title>{{ section.title }}</v-card-title>
          <v-card-text v-html="section.description" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      title: 'Mangrove for Businesses, Entrepreneurs, Developers',
      subtitle: 'Improve your project with open-data online reviews.',
      content: [
        {
          icon: 'mdi-api',
          title: 'APIs',
          description: `Mangrove is built for integration.
            Offer your users a seamlessly integrated experience of online reviews,
            without them ever having to leave your platform.
            <br />
            <br />
            <a href="${process.env.VUE_APP_API_URL}/swagger-ui" target="_blank">Go to the API documentation</a>`
        },
        {
          icon: 'mdi-xml',
          title: 'Embed',
          description: `Mangrove provides you with a tool to grow:
            use Mangrove’s free and easy-to-use script to embed review functionality
            or just display your reviews on your site.
            <br />
            <br />
            Coming soon...`
        },
        {
          icon: 'mdi-folder-download',
          title: 'Dataset download',
          description: `Develop new aggregation or recommendation algorithms,
            do research, or provide reputation management services to your clients
            by analysing the dataset.
            <br />
            <br />
            <a href="${process.env.VUE_APP_API_URL}/reviews" target="_blank">Download the dataset</a>`
        }
      ]
    }
  }
}
</script>
