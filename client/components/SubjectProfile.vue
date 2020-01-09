<template>
  <v-container v-if="subject">
    <v-row justify="center">
      <vl-map
        ref="map"
        :load-tiles-while-animating="true"
        :load-tiles-while-interacting="true"
        v-if="subject.coordinates"
        style="height: 400px"
        data-projection="EPSG:4326"
        class="mx-5 mb-5"
      >
        <vl-view :center="subject.coordinates" :zoom="15" />

        <vl-interaction-select @update:features="selectFeature($event)" />

        <vl-feature v-for="(p, i) in points" :key="i" :id="p.id">
          <vl-geom-point :coordinates="p.coordinates" />
          <vl-style-box>
            <vl-style-icon
              :scale="p.scale"
              :anchor="[0.5, 1]"
              src="map-marker.png"
            />
          </vl-style-box>
        </vl-feature>

        <vl-layer-tile id="osm">
          <vl-source-osm />
        </vl-layer-tile>
      </vl-map>
      <v-btn
        @click="geoSearch"
        absolute
        class="ma-3"
        style="background: rgb(255, 255, 255, 0.7)"
        >Search selected area</v-btn
      >
    </v-row>

    <v-card>
      <v-dialog v-if="images.length" max-width="700">
        <template v-slot:activator="{ on }">
          <v-row align="center" class="mx-4 pt-4">
            <v-img
              v-on="on"
              v-for="image in images"
              :key="image"
              :src="image"
              max-height="80"
              max-width="80"
              contain
            />
            <v-btn v-on="on" text>See more photos</v-btn>
          </v-row>
        </template>
        <v-card>
          <v-carousel height="auto">
            <v-carousel-item v-for="(image, i) in images" :key="i">
              <v-row>
                <v-img :src="image" contain />
              </v-row>
            </v-carousel-item>
          </v-carousel>
        </v-card>
      </v-dialog>
      <v-card-title>
        {{ subject.title }}
      </v-card-title>
      <v-row align="center" class="mx-4 my-n4">
        <v-rating :value="subject.quality" half-increments dense class="mr-2" />
        {{ subject.quality }} ({{ subject.count }})
      </v-row>
      <v-card-subtitle>{{ subject.subtitle }}</v-card-subtitle>
      <v-list flat>
        <v-list-item v-for="(detail, i) in details" :key="i" class="my-n4">
          <v-list-item-icon class="mr-4">
            <v-icon v-text="detail.icon" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title v-html="detail.content"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-card-actions class="justify-center">
        <v-btn @click.stop="reviewForm = true">Write a review</v-btn>
        <ReviewForm v-model="reviewForm" :subject="subject" />
      </v-card-actions>
    </v-card>
    <ReviewList :rootSub="$route.query.sub" />
  </v-container>
</template>

<script>
import { transformExtent, get } from 'ol/proj'
import { imageUrl } from '../utils'
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
      return this.$store.state.subjects[this.$route.query.sub]
    },
    details() {
      const s = this.subject
      return [
        {
          icon: 'mdi-map-marker',
          content: (s.scheme === GEO || s.scheme === LEI) && s.description
        },
        {
          icon: 'mdi-compass',
          content:
            s.scheme === GEO &&
            `<a href="${s.sub}">${s.coordinates.join(', ')}</a>`
        },
        {
          icon: 'mdi-circle',
          content: s.scheme === ISBN && s.description
        },
        {
          icon: 'mdi-earth',
          content: s.website && `<a href=${s.website}>${s.website}</a>`
        },
        {
          icon: 'mdi-clock-outline',
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
          icon: 'mdi-circle',
          content: s.isbn && `ISBN ${s.isbn}`
        },
        {
          icon: 'mdi-circle',
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
    },
    points() {
      return Object.values(this.$store.state.subjects)
        .filter((subject) => subject.scheme === GEO)
        .map((subject) => {
          return {
            id: subject.sub,
            coordinates: subject.coordinates,
            scale: subject.sub === this.subject.sub ? 1.2 : 0.7
          }
        })
    }
  },
  methods: {
    selectFeature(features) {
      if (features[0] && this.$route.query.sub !== features[0].id) {
        this.$store.dispatch('selectSubject', [
          this.$route.query,
          features[0].id
        ])
      }
    },
    geoSearch() {
      const geo = transformExtent(
        this.$refs.map.$map.getView().calculateExtent(),
        get('EPSG:3857'),
        get('EPSG:4326')
      ).join(',')
      console.log('Map query: ', geo)
      this.$router.push({
        path: 'search',
        query: {
          [GEO]: geo,
          q: this.$route.query.q,
          sub: this.$route.query.sub
        }
      })
    }
  }
}
</script>
