<template>
  <InfoPage :image="image" :title="title" :content="content" />
</template>

<script>
import online from '../content/use_cases/online.md'
import business from '../content/use_cases/business.md'
import cities from '../content/use_cases/cities.md'
import entrepreneurs from '../content/use_cases/entrepreneurs.md'
import InfoPage from '~/components/InfoPage'

export default {
  components: {
    InfoPage
  },
  head() {
    return {
      title: this.title,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Mangrove Open Reviews use cases.'
        }
      ]
    }
  },
  data() {
    return {
      title: 'Use Cases',
      image: require('~/assets/build/leaf_2000x190.jpg'),
      content: [online, business, cities, entrepreneurs]
    }
  }
}
</script>
