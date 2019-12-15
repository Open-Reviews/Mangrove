<template>
  <v-container>
    <h1 class="display-3 text-center my-12">Contribute to Mangrove</h1>
    <v-container v-for="(item, i) in content" :key="i">
      <v-row v-if="i % 2">
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
  </v-container>
</template>

<script>
import { html as integrateContent } from '../content/contribute/1-integrate.md'
import { html as spreadContent } from '../content/contribute/2-spread.md'
import { html as codeContent } from '../content/contribute/3-code.md'
import { html as designContent } from '../content/contribute/4-design.md'
import { html as donateContent } from '../content/contribute/5-donate.md'

export default {
  data() {
    return {
      dumpUrl: `${process.env.VUE_APP_API_URL}/request`,
      titleClass: 'display-1',
      content: [
        {
          title:
            'Can your favourite app be improved by integrating open reviews?',
          content: integrateContent,
          image: 'contribute/1-integrate.jpg'
        },
        {
          title:
            'Would you like to see more people using open and privacy-preserving services?',
          content: spreadContent,
          image: 'contribute/2-spread.jpg'
        },
        {
          title: 'Do you code for fun?',
          content: codeContent,
          image: 'contribute/3-code.jpg'
        },
        {
          title: 'Are you a UI/UX artist?',
          content: designContent,
          image: 'contribute/4-design.jpg'
        },
        {
          title:
            'Do you agree that some things should not be for-profit, but nevertheless need funding?',
          content: donateContent,
          image: 'contribute/5-donate.jpg'
        }
      ]
    }
  }
}
</script>
