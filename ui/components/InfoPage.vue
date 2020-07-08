<template>
  <div>
    <v-img :src="image" class="white--text d-flex align-end pa-10">
      <h1 v-text="title" class="display-3" />
    </v-img>
    <v-container
      v-for="(item, i) in content"
      :key="i"
      style="max-width: 1100px"
    >
      <h2
        v-text="item.attributes.title"
        class="display-2 mt-10 font-weight-light"
      />
      <h3
        v-text="item.attributes.subtitle"
        class="display-1 mt-5 font-weight-light"
      />
      <v-row align="center">
        <v-col v-html="item.html" class="mb-2 mt-5 title font-weight-light" />
      </v-row>
      <v-divider class="mt-12" />
    </v-container>
  </div>
</template>

<script>
export default {
  props: {
    image: String,
    title: String,
    // [{
    //  title: String,
    //  content: String,
    //  Option<button: { label: String, link: String}>,
    //  Option<icons: [{icon: String, link: String}]>
    // }]
    content: Array
  }
}
</script>
