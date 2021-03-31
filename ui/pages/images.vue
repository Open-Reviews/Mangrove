<template>
  <v-container>
    <h1>Images submitted by the reviewers</h1>
    <v-row class="mb-4 mt-4" justify="center">
      <v-pagination
        v-if="images.length"
        v-model="page"
        :length="numberOfPages"
        circle
      ></v-pagination>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        md="3"
        sm="6"
        v-for="image in pageImages"
        :key="image.src"
        style="display:flex; align-items:center"
      >
        <a :href="parentLink(image.parent)" target="_blank">
          <img 
            :src="image.src" width="100%" 
            max-height="400"
          />
        </a>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
const IMAGES_PER_PAGE = 20

export default {
  name: 'ReviewImageList',
  mounted(){
    this.$store.dispatch('getReviews', { }).then(({reviews}) => {
      const images = []
      reviews.filter(r => r.payload.images).forEach((r) => {
        console.log("pushing", r.payload.images.map(img => { return { src: img.src, parent: r.sub } }))
        images.push(...r.payload.images.map(img => { return { src: img.src, parent: r.signature } }))
      })
      this.images = images
    })
  },
  data() {
    return {
      images: [],
      page: 1
    }
  },
  computed: {
    pageImages(){
      return this.images.slice((this.page - 1)*IMAGES_PER_PAGE, this.page*IMAGES_PER_PAGE)
    },
    numberOfPages(){
      console.log("n pages", Math.ceil(this.images.length / IMAGES_PER_PAGE))
      return Math.ceil(this.images.length / IMAGES_PER_PAGE);
    }
  },
  methods: {
    parentLink(signature){
      return `list?signature=${signature}`
    }
  }
}
</script>
<style scoped>
.text-center {
  text-align: center;
}
</style>