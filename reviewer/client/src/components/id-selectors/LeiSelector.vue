<template>
  <div>
    LEI to review:
    <input v-model.lazy.trim="searchQuery" />
    <button v-on:click="fuzzySearch">Search</button>
    <div v-if="searchError">
      {{ searchError }}
    </div>
    <div v-else-if="searchResults">
      <ul>
        <li v-for="entity in searchResults" :key="entity[0]">
          {{ entity }}
          <button v-on:click="request(entity[0])">
            Select
          </button>
          <span v-if="entity[0] === id"> selected </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: null,
      searchResults: null,
      searchError: null
    };
  },
  computed: {
    id() {
      return this.$store.state.id;
    }
  },
  methods: {
    entityName(completion) {
      return completion.attributes.value;
    },
    request(lei) {
      this.$store.commit("id", lei);
      this.$parent.request();
    },
    fuzzySearch() {
      this.axios
        .get("https://api.gleif.org/api/v1/fuzzycompletions", {
          params: {
            field: "fulltext",
            q: this.searchQuery
          },
          headers: { "Content-Type": "application/vnd.api+json" }
        })
        .then(response => {
          this.searchError = null;
          Promise.all(
            response.data.data.map(completion =>
              completion.relationships
                ? this.entityLookup(
                    completion.relationships["lei-records"].data.id
                  )
                    .then(entity => entity.attributes)
                    .then(attrs => [
                      attrs.lei,
                      attrs.entity.legalName.name,
                      attrs.entity.legalAddress.addressLines,
                      attrs.entity.legalAddress.city,
                      attrs.entity.legalAddress.country
                    ])
                : null
            )
          ).then(entities => {
            // Filter out entities without relationship.
            this.searchResults = Array.from(new Set(entities)).filter(e => e);
          });
        })
        .catch(error => {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.headers);
            this.searchError = error.response.data;
          } else if (error.request) {
            console.log(error.request);
            this.searchError = "Server not reachable.";
          } else {
            console.log("Client request processing error: ", error.message);
            this.searchError = "Internal client error, please report.";
          }
        });
    },
    entityLookup(lei) {
      return this.axios
        .get(`https://api.gleif.org/api/v1/lei-records/${lei}`, {
          headers: { "Content-Type": "application/vnd.api+json" }
        })
        .then(response => {
          this.searchError = null;
          return response.data.data;
        })
        .catch(error => {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.headers);
            this.searchError = error.response.data;
          } else if (error.request) {
            console.log(error.request);
            this.searchError = "Server not reachable.";
          } else {
            console.log("Client request processing error: ", error.message);
            this.searchError = "Internal client error, please report.";
          }
        });
    }
  }
};
</script>
