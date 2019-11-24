<template>
  <div>
    Your review:
    <star-rating v-model="rating"></star-rating>
    <span v-if="!rating"> No rating, pick number of stars. </span>
    <br /><br />
    <input v-model="opinion" placeholder="your opinion" />
    <br /><br />
    <div v-if="$store.state.showExtra">
      <ExtraForm />
      <br /><br />
    </div>
    <div v-else>
      <button v-on:click="showExtra">Upload files</button>
      <br /><br />
    </div>
    <br /><br />
    <div v-if="$store.state.showMeta">
      <MetaForm />
      <br /><br />
    </div>
    <div v-else>
      <button v-on:click="showMeta">Enter additional information</button>
      <br /><br />
    </div>
    <button v-on:click="submitReview">Submit review</button>
    <br /><br />
    <div v-if="submitError">Error encountered: {{ submitError }}</div>
  </div>
</template>

<script>
import StarRating from "vue-star-rating";
import ExtraForm from "./ExtraForm.vue";
import MetaForm from "./MetaForm.vue";

export default {
  components: {
    StarRating,
    ExtraForm,
    MetaForm
  },
  computed: {
    rating: {
      get() {
        return this.$store.state.rating;
      },
      set(value) {
        this.$store.commit("rating", value);
      }
    },
    opinion: {
      get() {
        return this.$store.state.opinion;
      },
      set(value) {
        this.$store.commit("opinion", value);
      }
    },
    submitError: {
      get() {
        return this.$store.state.errors.submit;
      },
      set(e) {
        this.$store.commit("submiterror", e);
      }
    }
  },
  methods: {
    showExtra: function() {
      this.$store.commit("showextra", true);
    },
    showMeta: function() {
      this.$store.commit("showmeta", true);
    },
    submitReview: function() {
      this.$store.dispatch("submitReview", {
        sub: this.$store.state.selectedUri,
        rating: this.rating,
        opinion: this.opinion,
        extradata: this.$store.state.extraHashes
      });
    }
  }
};
</script>
