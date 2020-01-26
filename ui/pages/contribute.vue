<template>
  <div>
    <v-img :src="image" class="white--text d-flex align-end pa-10">
      <h1 v-text="title" class="display-3" />
      <h2 v-text="subtitle" class="display-1" />
    </v-img>
    <v-container
      v-for="(item, i) in content"
      :key="i"
      class="text-center"
      style="max-width: 1200px"
    >
      <h3 :class="titleClass" v-text="item.title" />
      <div v-html="item.content" class="mb-5" />
      <v-btn
        v-if="item.button"
        v-text="item.button.label"
        :href="item.button.link"
        color="secondary"
        class="black--text"
      />
      <v-btn
        v-for="icon in item.icons"
        :key="icon.icon"
        :href="icon.link"
        fab
        class="mx-1"
      >
        <v-icon v-if="icon.icon">{{ icon.icon }}</v-icon>
        <v-avatar v-else>
          <v-img :src="icon.img" max-height="28" contain />
        </v-avatar>
      </v-btn>
      <v-divider class="mt-5" />
    </v-container>
  </div>
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
import { SOCIALS, GITLAB, OPEN_COLLECTIVE } from '~/store/data'

export default {
  data() {
    return {
      image: require('~/assets/contribute_rope_2000x400.jpg'),
      title: 'Contribute',
      subtitle:
        'Join the Movement so that more people can share and benefit freely',
      dumpUrl: `${process.env.VUE_APP_API_URL}/request`,
      titleClass: 'display-1',
      content: [
        {
          title: donateTitle.title,
          content: donateContent,
          button: { label: 'Donate', link: OPEN_COLLECTIVE }
        },
        {
          title: integrateTitle.title,
          content: integrateContent
        },
        {
          title: spreadTitle.title,
          content: spreadContent,
          icons: SOCIALS
        },
        {
          title: codeTitle.title,
          content: codeContent,
          icons: [
            {
              icon: 'mdi-gitlab',
              link: GITLAB
            }
          ]
        }
      ]
    }
  }
}
</script>
