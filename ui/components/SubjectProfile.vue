<template>
  <v-container v-if="subject">
    <v-card class="my-3">
      <slot />
      <v-dialog v-if="images.length" max-width="700">
        <template v-slot:activator="{ on }">
          <v-row align="center" class="mx-4 pt-4">
            <v-img
              v-on="on"
              v-for="image in images"
              :key="image"
              :src="image"
              max-height="400"
              max-width="7vw"
              class="elevation-3 mr-2"
            />
            <v-btn v-on="on" v-if="images.length > 5" text>More</v-btn>
          </v-row>
        </template>
        <v-card>
          <v-carousel height="auto">
            <v-carousel-item v-for="(image, i) in images" :key="i">
              <v-row>
                <v-img :src="image" max-height="90vh" contain />
              </v-row>
            </v-carousel-item>
          </v-carousel>
        </v-card>
      </v-dialog>
      <v-card-title>
        {{ subject.title }}
      </v-card-title>
      <v-card-subtitle
        >{{ subject.subtitle }}
        <v-row align="center" class="ml-auto">
          <v-rating
            :value="subject.quality"
            half-increments
            dense
            class="mr-2"
            readonly
          />
          {{ subject.quality && subject.quality.toFixed(1) }} ({{
            subject.count
          }})
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
    <ReviewList :rootSub="$route.query.sub" />
  </v-container>
</template>

<script>
import { imageUrl, isMobile } from '../utils'
import { GEO, LEI, ISBN } from '../store/scheme-types'
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'

export default {
  components: {
    ReviewForm,
    ReviewList
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
      const images = [].concat
        .apply(
          [],
          Object.values(this.$store.state.reviews)
            .filter(({ payload }) => payload.sub === this.$route.query.sub)
            .map(({ payload }) => payload.extra_hashes)
            .filter((eh) => eh)
        )
        .map((eh) => imageUrl(eh))
      if (this.subject.image) {
        images.push(this.subject.image)
      }
      return images.slice(0, 4)
    }
  }
}
</script>

<style>
a {
  color: black !important;
}
</style>
