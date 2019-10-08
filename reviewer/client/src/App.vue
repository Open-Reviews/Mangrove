<template>
  <div id="app">
    <IdSelector />
    <br />
    <ReviewBrowser />
    <br />
    <ReviewForm />
  </div>
</template>

<script>
import IdSelector from "./components/IdSelector.vue";
import ReviewBrowser from "./components/ReviewBrowser.vue";
import ReviewForm from "./components/ReviewForm.vue";

export default {
  name: "app",
  created() {
    this.$store.dispatch("generateKeypair");
  },
  components: {
    IdSelector,
    ReviewBrowser,
    ReviewForm
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
