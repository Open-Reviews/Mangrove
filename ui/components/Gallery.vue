<template>
  <v-dialog v-if="images.length" max-width="90vw" width="auto ">
    <template v-slot:activator="{ on }">
      <v-row align="center" class="mx-4 pt-4 pb-4">
        <v-img
            v-on="on"
            v-for="img in maxIcons ? images.slice(0, maxIcons):images"
            :key="img.src"
            :src="img.src"
            :max-height="maxIconHeight"
            :max-width="maxIconWidth"
            class="elevation-3 mr-2"
        />
        <v-btn v-on="on" v-if="(showMoreButton && images.length > maxIcons)" text>More</v-btn>
      </v-row>
    </template>
    <v-card width="auto">
      <v-carousel height="auto">
        <v-carousel-item v-for="(img, i) in images" :key="i">
            <v-row>
              <img :src="img.src" style="object-fit: contain; max-height: 90vh; max-width: 100vw"/>
            </v-row>
        </v-carousel-item>
      </v-carousel>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'Gallery',
  props: {
    images: {
      type: Array,
      default: () => {
        return []
      }
    },
    dense: Boolean,
    maxIcons: Number,
    maxIconHeight: String,
    maxIconWidth: String,
    showMoreButton: Boolean
  }
}
</script>
