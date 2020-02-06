<template>
  <div>
    <v-img :src="image" class="white--text d-flex align-end pa-10">
      <h1 v-text="title" class="display-3" />
      <h2 v-text="subtitle" class="display-1" />
    </v-img>
    <v-container
      v-for="(item, i) in content"
      :key="i"
      :style="item.image ? 'max-width: 1400px' : 'max-width: 1100px'"
      class="text-center"
    >
      <h3
        v-if="item.title"
        v-text="item.title"
        class="display-1 mt-5 font-weight-light"
      />
      <v-row align="center">
        <v-col
          v-html="item.content"
          :class="item.image ? 'text-left' : ''"
          class="mb-2 mt-5 title font-weight-light"
        />
        <v-col v-if="item.image" cols="6"><v-img :src="item.image"/></v-col>
      </v-row>
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
        target="_blank"
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
