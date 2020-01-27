<template>
  <InfoPage
    :image="image"
    :title="title"
    :subtitle="subtitle"
    :content="content"
  />
</template>

<script>
import InfoPage from '~/components/InfoPage'

export default {
  components: {
    InfoPage
  },
  data() {
    return {
      title: 'Mangrove for Businesses, Entrepreneurs, Developers',
      subtitle: 'Improve your project with open-data online reviews.',
      image: require('~/assets/build_leaf_2000x400.jpg'),
      content: [
        {
          title: 'APIs',
          content: `Mangrove is built for integration.
            Offer your users a seamlessly integrated experience of online reviews,
            without them ever having to leave your platform.`,
          icons: [
            {
              icon: 'mdi-api',
              link: `${process.env.VUE_APP_API_URL}/swagger-ui`
            }
          ]
        },
        {
          title: 'Embed',
          content: `Mangrove provides you with a tool to grow:
            use Mangrove’s free and easy-to-use script to embed review functionality
            or just display your reviews on your site.
            <br />
            <br />
            Coming soon...`,
          icons: [{ icon: 'mdi-xml' }]
        },
        {
          title: 'Dataset download',
          content: `Develop new aggregation or recommendation algorithms,
            do research, or provide reputation management services to your clients
            by analysing the dataset.`,
          icons: [
            {
              icon: 'mdi-folder-download',
              link: `${process.env.VUE_APP_API_URL}/reviews`
            }
          ]
        }
      ]
    }
  }
}
</script>
