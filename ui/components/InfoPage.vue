<template>
  <div>
    <v-img :src="image" class="white--text d-flex align-end pa-10">
      <h1 v-text="title" class="display-3" />
      <h2 v-text="subtitle" class="display-1" />
    </v-img>
    <v-container
      v-for="(item, i) in content"
      :key="i"
      class="text-center"
      style="max-width: 1200px"
    >
      <h3 v-text="item.title" class="display-1 mt-5 font-weight-light" />
      <div
        v-html="item.content"
        class="mb-10 mt-5 headline font-weight-light"
      />
      <v-btn
        v-if="item.button"
        v-text="item.button.label"
        :href="item.button.link"
        color="secondary"
        class="black--text"
      />
      <v-btn
        v-for="icon in item.icons"
        :key="icon.icon"
        :href="icon.link"
        fab
        class="mx-10"
      >
        <v-icon v-if="icon.icon">{{ icon.icon }}</v-icon>
        <v-avatar v-else>
          <v-img :src="icon.img" max-height="28" contain />
        </v-avatar>
      </v-btn>
      <v-divider class="mt-12" />
    </v-container>
  </div>
</template>

<script>
export default {
  props: {
    image: String,
    title: String,
    subtitle: String,
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
