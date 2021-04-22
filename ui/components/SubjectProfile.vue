<template>
  <v-container v-if="subject">
    <v-card class="my-3">
      <slot />
      <Gallery 
        :images="images.map(src => {return {src: src}})" 
        :maxIcons="isSmall ? 3 : 4" 
        :maxIconWidth="isSmall ? '16vw' : '7vw'" 
        maxIconHeight="400" 
        showMoreButton />
      <v-card-title>
        {{ subject.title }} 
        <v-menu
            bottom
            left
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                v-bind="attrs"
                v-on="on"
                class="card-title-menu-btn"
              >
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item>
                <v-list-item-title>
                  <v-btn
                    @click="copySubToClipboard"
                    text
                  >
                    Copy subject identifier
                  </v-btn>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
      </v-card-title>
      <v-card-subtitle
        >{{ subject.subtitle }}
        <v-row align="center" class="ml-auto pt-2">
          <v-rating
            :value="stars"
            :background-color="subject.quality ? 'primary' : 'grey lighten-2'"
            half-increments
            dense
            class="mr-2"
            readonly
          />
          {{ stars && stars.toFixed(1) }} ({{ subject.count }})
        </v-row>
      </v-card-subtitle>
      <v-list-item-content>
        <v-list flat>
          <v-list-item v-for="(detail, i) in details" :key="i" class="my-n6">
            <v-list-item-icon class="mr-4">
              <v-icon v-text="detail.icon" />
            </v-list-item-icon>
            <v-card-text>
              <v-list-item-title
                v-html="detail.content"
                class="text-wrap"
                align="start"
              />
            </v-card-text>
          </v-list-item>
        </v-list>
      </v-list-item-content>
      <v-card-actions class="justify-center">
        <v-btn @click.stop="reviewForm = true" color="#ffeb3b"
          >Write a review</v-btn
        >
        <ReviewForm v-model="reviewForm" :subject="subject" />
      </v-card-actions>
    </v-card>
    <ReviewList :query="{ sub: $route.query.sub }" />
  </v-container>
</template>

<script>
import { isMobile } from '../utils'
import { GEO, LEI, ISBN } from '../store/scheme-types'
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'
import Gallery from './Gallery'

export default {
  components: {
    ReviewForm,
    ReviewList,
    Gallery
  },
  data() {
    return {
      reviewForm: false
    }
  },
  computed: {
    subject() {
      return this.$store.getters.subject(this.$route.query.sub)
    },
    isSmall() {
      return this.$vuetify.breakpoint.smAndDown
    },
    stars() {
      return this.subject.quality && (this.subject.quality + 25) / 25
    },
    details() {
      const s = this.subject
      const coordinates =
        s.scheme === GEO &&
        s.coordinates
          .slice()
          .reverse()
          .join(', ')
      return [
        {
          icon: 'mdi-map-marker',
          content: (s.scheme === GEO || s.scheme === LEI) && s.description
        },
        {
          icon: 'mdi-compass',
          content:
            coordinates && isMobile()
              ? `<a href="${s.sub}">${coordinates}</a>`
              : coordinates
        },
        {
          icon: 'mdi-calendar',
          content: s.scheme === ISBN && s.description
        },
        {
          icon: 'mdi-earth',
          content: s.website && `<a href=${s.website}>${s.website}</a>`
        },
        {
          icon: 'mdi-clock',
          content: s.openingHours
        },
        {
          icon: 'mdi-phone',
          content: s.phone
        },
        {
          icon: 'mdi-pound-box',
          content:
            s.lei &&
            `LEI code <a href=https://search.gleif.org/#/record/${s.lei}>${s.lei}</a>`
        },
        {
          icon: 'mdi-barcode',
          content: s.isbn && `ISBN ${s.isbn}`
        },
        {
          icon: 'mdi-text-subject',
          content: s.subjects && `Subjects: ${s.subjects.join(', ')}`
        }
      ].filter((detail) => detail.content)
    },
    images() {
      const images = new Set()
      Object.values(this.$store.state.reviews)
        .filter(({ payload }) => payload.sub === this.$route.query.sub)
        .map(({ payload }) => payload.images)
        .filter(Boolean)
        .map((imgs) => imgs.map((img) => images.add(img.src)))
      if (this.subject.image) {
        images.add(this.subject.image)
      }
      return [...images]
    }
  },
  methods: {
    async copySubToClipboard() {
      try {
        await this.$copyText(this.$route.query.sub);
        alert("Subject ID copied to clipboard!")
      } catch (e) {
        console.error(e);
      }
    }
  }
}
</script>

<style scoped>
a {
  color: black !important;
}
.card-title-menu-btn {
  position: absolute;
  right: 0;
}
</style>
