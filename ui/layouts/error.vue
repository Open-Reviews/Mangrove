<template>
  <v-app>
    <h1>
      {{ info }}
    </h1>
    <NuxtLink to="/">
      Home page
    </NuxtLink>
  </v-app>
</template>

<script>
export default {
  layout: 'empty',
  props: {
    error: {
      type: Object,
      default: null
    }
  },
  head() {
    const title =
      this.error.statusCode === 404 ? this.pageNotFound : this.otherError
    return {
      title
    }
  },
  data() {
    return {
      pageNotFound: '404 Not Found',
      otherError: 'An error occurred: '
    }
  },
  computed: {
    info() {
      return this.error.statusCode === 404
        ? this.pageNotFound
        : this.otherError + this.error
    }
  }
}
</script>

<style scoped>
h1 {
  font-size: 20px;
}
</style>
