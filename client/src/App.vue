<template>
  <div id="app">
    <Profile />
    <br />
    <UriSearch />
    <br />
    <UriBrowser />
    <br />
    <ReviewBrowser />
    <br />
    <ReviewForm />
    <br />
    <a :href="dumpUrl">Get all Mangrove data</a>
  </div>
</template>

<script>
import Profile from "./components/Profile.vue";
import UriSearch from "./components/UriSearch.vue";
import UriBrowser from "./components/UriBrowser.vue";
import ReviewBrowser from "./components/ReviewBrowser.vue";
import ReviewForm from "./components/ReviewForm.vue";

export default {
  name: "app",
  created() {
    this.$store.dispatch("generateKeypair");
  },
  components: {
    Profile,
    UriSearch,
    UriBrowser,
    ReviewBrowser,
    ReviewForm
  },
  data() {
    return {
      dumpUrl: `${process.env.VUE_APP_API_URL}/request`
    };
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
