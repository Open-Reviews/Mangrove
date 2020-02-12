<template>
  <InfoPage
    :image="image"
    :title="title"
    :subtitle="subtitle"
    :content="content"
  />
</template>

<script>
import { html as introContent } from '../content/build/intro.md'
import {
  html as integrateContent,
  attributes as integrateTitle
} from '../content/build/integrate.md'
import {
  html as downloadContent,
  attributes as downloadTitle
} from '../content/build/download.md'
import {
  html as embedContent,
  attributes as embedTitle
} from '../content/build/embed.md'
import InfoPage from '~/components/InfoPage'
import { LINKS } from '~/store/links'

export default {
  components: {
    InfoPage
  },
  data() {
    return {
      title: 'Build on Mangrove',
      subtitle:
        'Build a business, or enrich your product or service with open reviews',
      image: require('~/assets/build/leaf_2000x190.jpg'),
      content: [
        {
          content: introContent,
          image: require('~/assets/build/ecosystem.png'),
          icons: [
            {
              icon: 'mdi-email-outline',
              link:
                'mailto:mangrove@planting.space?subject=Interest in integrating with Mangrove'
            },
            LINKS.Riot
          ]
        },
        {
          title: integrateTitle.title,
          content: integrateContent,
          icons: [
            {
              icon: 'mdi-api',
              link: `https://app.swaggerhub.com/apis/keorn/Mangrove_Server/0.1.0`
            }
          ]
        },
        {
          title: downloadTitle.title,
          content: downloadContent,
          icons: [
            {
              icon: 'mdi-folder-download',
              link: `${process.env.VUE_APP_API_URL}/reviews`
            }
          ]
        },
        {
          title: embedTitle.title,
          content: embedContent,
          icons: [{ icon: 'mdi-xml' }]
        }
      ]
    }
  }
}
</script>
