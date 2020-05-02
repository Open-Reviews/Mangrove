<template>
  <InfoPage
    :image="image"
    :title="title"
    :subtitle="subtitle"
    :content="content"
  />
</template>

<script>
import {
  html as integrateContent,
  attributes as integrateTitle
} from '../content/contribute/integrate.md'
import {
  html as spreadContent,
  attributes as spreadTitle
} from '../content/contribute/spread.md'
import {
  html as codeContent,
  attributes as codeTitle
} from '../content/contribute/code.md'
import {
  html as donateContent,
  attributes as donateTitle
} from '../content/contribute/donate.md'
import InfoPage from '~/components/InfoPage'
import { LINKS } from '~/store/links'

export default {
  components: {
    InfoPage
  },
  data() {
    return {
      image: require('~/assets/contribute_rope_2000x190.jpg'),
      title: 'Contribute',
      subtitle:
        'Join the Ecosystem so that more people can share and benefit freely',
      dumpUrl: `${process.env.VUE_APP_API_URL}/request`,
      content: [
        {
          title: donateTitle.title,
          content: donateContent,
          button: { label: 'Donate', link: LINKS.OpenCollective.link }
        },
        {
          title: integrateTitle.title,
          content: integrateContent
        },
        {
          title: spreadTitle.title,
          content: spreadContent,
          icons: [LINKS.Mastodon, LINKS.Twitter]
        },
        {
          title: codeTitle.title,
          content: codeContent,
          icons: [LINKS.Gitlab, LINKS.Riot]
        }
      ]
    }
  },
  head() {
    return {
      title: 'Mangrove Reviews, ' + this.title,
      meta: [
        {
          name: 'description',
          content: this.subtitle
        }
      ]
    }
  }
}
</script>
