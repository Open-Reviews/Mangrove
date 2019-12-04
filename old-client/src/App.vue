<template>
  <div id="app">
    <Account />
    <br />
    <SubjectList />
    <br />
    <ReviewList />
    <br />
    <ReviewForm />
    <br />
    <TopBar />
    <Content />
    <Footer />
  </div>
</template>

<script>
import Account from "./components/personal/Account";
import SubjectList from "./components/SubjectList.vue";
import ReviewList from "./components/ReviewList.vue";
import ReviewForm from "./components/form/ReviewForm.vue";
import TopBar from "./components/static/TopBar.vue";
import Content from "./components/Content";
import Footer from "./components/static/Footer.vue";

export default {
  name: "app",
  created() {
    this.$store.dispatch("generateKeypair");
  },
  components: {
    Account,
    SubjectList,
    ReviewList,
    ReviewForm,
    TopBar,
    Content,
    Footer
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
