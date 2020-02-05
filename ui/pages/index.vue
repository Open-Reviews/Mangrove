<template>
  <div>
    <v-row class="mb-1 text-center white--text">
      <v-img :src="front.image" height="97vh" class="display-3 pa-12">
        <h1
          v-html="front.title"
          :class="isSmall ? 'display-2' : 'display-4'"
          class="my-5"
        />
        <h2
          v-text="front.tagline"
          :class="isSmall ? 'headline' : 'display-1'"
        />
        <v-row>
          <v-col />
          <v-col :cols="isSmall ? 12 : 6">
            <SearchBox @focus="focus = $event" no-filter />
            <v-row class="justify-space-around mt-n8">
              <span
                v-text="front.subsearch.join(' ᐧ ')"
                class="title white--text"
              />
            </v-row>
          </v-col>
          <v-col />
        </v-row>
        <v-row
          v-if="!isSmall || (isSmall && !focus)"
          class="headline"
          style="position: absolute; bottom: 100px; margin-left: auto; margin-right: auto; width: 330px; left: 0; right: 0;"
          align="center"
        >
          <div class="ml-12">WHY MANGROVE</div>
          <v-img :src="arrow" max-height="10vh" contain class="ml-n12" />
        </v-row>
      </v-img>
    </v-row>
    <v-row v-for="(feature, i) in features" :key="i" class="mb-1">
      <v-img :src="feature.image" height="97vh" class="align-center">
        <v-row :class="{ 'mx-4': isSmall }">
          <v-card
            :style="
              !isSmall
                ? i % 2
                  ? 'right: 100px; margin-left: auto'
                  : 'left: 100px'
                : ''
            "
            max-width="700"
          >
            <v-card-title
              v-text="feature.title"
              class="display-1 font-weight-light"
            />
            <v-card-text
              v-html="feature.content"
              class="subtitle-1 font-weight-light"
            />
          </v-card>
        </v-row>
        <v-row v-if="feature.tip" justify="center">
          <a
            @click="$vuetify.goTo(0)"
            class="white--text display-2"
            style="position: absolute; bottom: 5px;"
          >
            <v-row align="center">
              {{ feature.tip }}
              <v-img
                :src="arrow"
                max-height="10vh"
                contain
                style="transform: rotate(180deg);"
                class="ml-n10"
              />
            </v-row>
          </a>
        </v-row>
      </v-img>
    </v-row>
    <v-dialog v-model="$store.state.alphaWarning" max-width="500">
      <v-card>
        <v-card-title v-text="demoAttributes.title" />
        <v-card-text v-html="demoContent" />
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dismissAlphaWarning" text>
            Ok, got it
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { DISMISS_ALPHA_WARNING, SET_FILTER } from '../store/mutation-types'
import SearchBox from '../components/SearchBox'
import {
  html as demoContent,
  attributes as demoAttributes
} from '~/content/index/demo.md'
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
      demoContent,
      demoAttributes,
      front: {
        image: require('~/assets/index/BG1_sunset_2000x950.jpg'),
        tagline: 'Share with others and make better decisions.',
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
          title: this.$vuetify.breakpoint.smAndDown
            ? complexAttributes.smallTitle
            : complexAttributes.title,
          content:
            (this.$vuetify.breakpoint.smAndDown
              ? complexAttributes.title + '</br></br>'
              : '') + complexContent,
          image: require('~/assets/index/BG2_people_1200x703.jpg')
        },
        {
          title: this.$vuetify.breakpoint.smAndDown
            ? openAttributes.smallTitle
            : openAttributes.title,
          content: openContent,
          image: require('~/assets/index/BG3_stairs_1200x843.jpg')
        },
        {
          title: this.$vuetify.breakpoint.smAndDown
            ? privacyAttributes.smallTitle
            : privacyAttributes.title,
          content: privacyContent,
          image: require('~/assets/index/BG4_cameras_1200x659.jpg'),
          tip: 'TRY IT'
        }
      ],
      arrow: require('~/assets/index/arrow.png'),
      focus: false
    }
  },
  computed: {
    isSmall() {
      return this.$vuetify.breakpoint.smAndDown
    }
  },
  mounted() {
    this.$store.commit(SET_FILTER, null)
  },
  methods: {
    dismissAlphaWarning() {
      this.$store.commit(DISMISS_ALPHA_WARNING)
    }
  }
}
</script>

<style scoped>
.v-card {
  display: block;
}
</style>
