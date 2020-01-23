<template>
  <div class="mt-n3">
    <v-row align="center" class="mb-1 text-center">
      <v-img :src="front.image" class="display-3 pa-12">
        <h1 v-html="front.title" class="display-4 my-5 white--text" />
        <h2 v-text="front.tagline" class="display-1 white--text" />
        <v-row>
          <v-col />
          <v-col cols="6">
            <SearchBox no-filter />
            <v-row class="justify-space-around">
              <span
                v-for="cat in front.subsearch"
                v-text="cat"
                class="title white--text"
              />
            </v-row>
          </v-col>
          <v-col />
        </v-row>
        <v-col class="white--text title">WHY MANGROVE</v-col>
      </v-img>
    </v-row>
    <v-row v-for="(feature, i) in features" :key="i" class="mb-1">
      <v-img :src="feature.image" class="align-center">
        <v-row>
          <v-col v-if="i % 2" />
          <v-col>
            <v-card max-width="700">
              <v-card-title
                v-text="feature.title"
                class="display-1 font-weight-light"
              />
              <v-card-text
                v-html="feature.content"
                class="subtitle-1 font-weight-light"
              />
            </v-card>
          </v-col>
          <v-col v-if="!(i % 2)" cols="6" />
        </v-row>
      </v-img>
    </v-row>
    <v-dialog v-model="$store.state.alphaWarning" max-width="500">
      <v-card>
        <v-card-title>
          This is a DEMO version
        </v-card-title>

        <v-card-text v-html="demoDialog" />

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dismissAlphaWarning" text>
            Ok, got it
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { DISMISS_ALPHA_WARNING } from '../store/mutation-types'
import SearchBox from '../components/SearchBox'
import {
  html as complexContent,
  attributes as complexAttributes
} from '~/content/index/complex.md'
import {
  html as openContent,
  attributes as openAttributes
} from '~/content/index/open.md'
import {
  html as privacyContent,
  attributes as privacyAttributes
} from '~/content/index/privacy.md'

export default {
  components: {
    SearchBox
  },
  data() {
    return {
      demoDialog: `Welcome to Mangrove! Please note that this is a <b>demo version</b> of the Mangrove online reviews service. Its purpose is to allow you to test the basic functionality and to <b>give us feedback</b> so that we can find all bugs and release a beta version soon. We highly appreciate feedback on all pages, just use the red button on the right as often as you like. Finally: please <b>donate</b> to help us add more features :)`,
      front: {
        image: require('~/assets/index/BG1_sunset_2000x950.jpg'),
        tagline: 'Take control of your experiences.',
        title: 'Read reviews. Write reviews.',
        subsearch: [
          'Restaurants',
          'Hotels',
          'Touristic sites',
          'Websites',
          'Companies',
          'Books'
        ]
      },
      features: [
        {
          title: complexAttributes.title,
          content: complexContent,
          image: require('~/assets/index/BG2_people_1200x703.jpg')
        },
        {
          title: openAttributes.title,
          content: openContent,
          image: require('~/assets/index/BG3_stairs_1200x843.jpg')
        },
        {
          title: privacyAttributes.title,
          content: privacyContent,
          image: require('~/assets/index/BG4_cameras_1200x659.jpg')
        }
      ]
    }
  },
  methods: {
    dismissAlphaWarning() {
      this.$store.commit(DISMISS_ALPHA_WARNING)
    }
  },
  middleware: 'clear'
}
</script>

<style scoped>
.v-card {
  display: block;
  margin-left: auto;
  margin-right: auto;
}
</style>
