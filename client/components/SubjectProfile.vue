<template>
  <v-container v-if="subject">
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
import ReviewForm from './ReviewForm'
import ReviewList from './ReviewList'

export default {
  components: {
    ReviewForm,
    ReviewList
  },
  computed: {
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
    }
  }
}
</script>
