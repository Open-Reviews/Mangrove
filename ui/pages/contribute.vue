<template>
  <div>
    <v-img :src="image" class="white--text d-flex align-end pa-10">
      <h1 class="display-3">Contribute</h1>
      <h2 v-text="subtitle" class="display-1" />
    </v-img>
    <v-container v-for="(item, i) in content" :key="i">
      <v-row v-if="isSmall || i % 2">
        <v-col>
          <v-img :src="item.image" max-width="550" />
        </v-col>
        <v-col class="mx-5">
          <span :class="titleClass">{{ item.title }}</span>
          <br />
          <br />
          <span v-html="item.content" />
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col class="mx-5">
          <span :class="titleClass">{{ item.title }}</span>
          <br />
          <br />
          <span v-html="item.content" />
        </v-col>
        <v-col>
          <v-img :src="item.image" max-width="550" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { html as integrateContent } from '../content/contribute/integrate.md'
import { html as spreadContent } from '../content/contribute/spread.md'
import { html as codeContent } from '../content/contribute/code.md'
import { html as donateContent } from '../content/contribute/donate.md'

export default {
  data() {
    return {
      image: require('~/assets/contribute_rope_2000x701.jpg'),
      subtitle:
        'Join the Movement so that more people can share and benefit freely',
      dumpUrl: `${process.env.VUE_APP_API_URL}/request`,
      titleClass: 'display-1',
      content: [
        {
          title: 'Support Mangrove financially',
          content: integrateContent,
          button: 'Donate'
        },
        {
          title: 'Spread the word',
          content: spreadContent,
          image: 'contribute/2-spread.jpg'
        },
        {
          title: 'Do you code for fun?',
          content: codeContent,
          image: 'contribute/3-code.jpg'
        },
        {
          title:
            'Do you agree that some things should not be for-profit, but nevertheless need funding?',
          content: donateContent,
          image: 'contribute/5-donate.jpg'
        }
      ]
    }
  },
  computed: {
    isSmall() {
      const size = this.$vuetify.breakpoint.name
      return size === 'xs' || size === 'sm'
    }
  }
}
</script>
