<template>
  <v-container
    v-if="subject"
    style="height: 90vh;position: fixed;width: 40vw"
    class="overflow-y-auto"
  >
    <vl-map
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      v-if="subject.coordinates"
      style="height: 400px"
      data-projection="EPSG:4326"
    >
      <vl-view
        ref="view"
        :zoom.sync="zoom"
        :center="subject.coordinates"
        :rotation.sync="rotation"
      ></vl-view>

      <vl-interaction-select
        :features.sync="selectedFeatures"
      ></vl-interaction-select>

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
        <vl-source-osm></vl-source-osm>
      </vl-layer-tile>
    </vl-map>

    <div>
      {{ selectedFeatures }}
    </div>

    <v-card>
      <v-container v-if="images.length !== 0">
        <v-carousel v-if="images.length > 1">
          <v-carousel-item v-for="(image, i) in images" :key="i">
            <v-img :src="image" />
          </v-carousel-item>
        </v-carousel>
        <v-img v-else :src="images[0]" />
      </v-container>
      <v-card-title>
        {{ subject.title }}
      </v-card-title>
      <v-row align="center" class="ma-auto">
        <v-rating :value="subject.quality" half-increments dense />
        {{ subject.quality }} ({{ subject.count }})
      </v-row>
      <v-card-subtitle>{{ subject.subtitle }}</v-card-subtitle>
      <v-card-actions>
        <ReviewForm />
      </v-card-actions>
    </v-card>
    <ReviewList />
  </v-container>
</template>

<script>
import { imageUrl } from '../utils'
import { GEO } from '../store/scheme-types'
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'

export default {
  components: {
    ReviewForm,
    ReviewList
  },
  data() {
    return {
      zoom: 15,
      rotation: 0
    }
  },
  computed: {
    selectedFeatures: {
      set(features) {
        if (features[0]) {
          this.$store.dispatch('selectSubject', [
            this.$route.query.q,
            features[0].id
          ])
        }
      }
    },
    subject() {
      return this.$store.state.subjects[this.$route.query.sub]
    },
    images() {
      const images = [].concat
        .apply(
          [],
          Object.values(this.$store.state.reviews)
            .filter((review) => review.sub === this.$route.query.sub)
            .map((review) => review.extra_hashes)
            .filter((eh) => eh)
        )
        .map((eh) => imageUrl(eh))
      if (this.subject.image) {
        images.push(this.subject.image)
      }
      return images
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
  }
}
</script>
