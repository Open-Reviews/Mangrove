<template>
  <div>
    What reviews are you interested in?
    <select v-model="idType">
      <option value="URL">Website</option>
      <option value="OLC+place">Business location or point of interest</option>
      <option value="MaReSi">Existing Mangrove review</option>
    </select>
    <br /><br />
    <div v-if="idType === 'URL'">
      <UrlSelector />
    </div>
    <div v-else-if="idType === 'OLC+place'">
      <LocationSelector />
    </div>
    <div v-else-if="idType === 'MaReSi'">
      <ReviewSelector />
    </div>
    <div v-if="requestError">Error encountered: {{ requestError }}</div>
  </div>
</template>

<script>
import UrlSelector from "./UrlSelector.vue";
import LocationSelector from "./LocationSelector.vue";
import ReviewSelector from "./ReviewSelector.vue";

export default {
  components: {
    UrlSelector,
    LocationSelector,
    ReviewSelector
  },
  computed: {
    idType: {
      get() {
        return this.$store.state.idType;
      },
      set(value) {
        this.$store.commit("idtype", value);
      }
    },
    requestError: {
      get() {
        return this.$store.state.errors.request;
      },
      set(e) {
        this.$store.commit("requesterror", e);
      }
    }
  },
  methods: {
    request: function() {
      this.axios
        .get("http://localhost:8000/request", {
          params: { idtype: this.idType, id: this.$store.state.id }
        })
        .then(response => {
          console.log(response);
          this.$store.commit("reviews", response["data"]);
          this.requestError = null;
        })
        .catch(error => {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.headers);
            this.requestError = error.response.data;
          } else if (error.request) {
            console.log(error.request);
            this.requestError = "Server not reachable.";
          } else {
            console.log("Client request processing error: ", error.message);
            this.requestError = "Internal client error, please report.";
          }
        });
    }
  }
};
</script>
