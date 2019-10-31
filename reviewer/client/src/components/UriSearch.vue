<template>
  <div>
    Search for reviews!
    <input v-model.lazy.trim="query" />
    <button v-on:click="search">Search</button>
    <div v-if="error">Error encountered: {{ error }}</div>
  </div>
</template>

<script>
import { QUERY, SEARCH_ERROR, ADD_URIS, EMPTY_URIS } from "../mutation-types";

export default {
  computed: {
    query: {
      get() {
        return this.$store.state.query;
      },
      set(value) {
        this.$store.commit(QUERY, value);
      }
    },
    error: {
      get() {
        return this.$store.state.errors.search;
      },
      set(value) {
        this.$store.commit(SEARCH_ERROR, value);
      }
    }
  },
  methods: {
    // Determine and insert potential valid URIs along with any descriptions.
    search() {
      Promise.all([
        this.$store.commit(EMPTY_URIS),
        this.$store.commit(ADD_URIS, this.searchUrl(this.query)),
        //this.$store.commit(ADD_URIS, this.searchGeo(this.query)),
        this.searchLei(this.query).then(uris =>
          this.$store.commit(ADD_URIS, uris)
        )
      ]).then(() => {
        // Try to select the first URI from the list.
        const first = this.$store.state.uris[0];
        if (first) this.$store.dispatch("requestReviews", { uri: first.uri });
      });
    },
    searchUrl(input) {
      // Use a very basic test if the query is a URL,
      // people rarely use period in queries otherwise.
      if (!input.includes(".")) {
        return [];
      }
      const url = new URL(
        input.startsWith("http") ? input : `https://${input}`
      );
      return url
        ? [{ uri: `${url.protocol}//${url.hostname}`, scheme: url.protocol }]
        : [];
    },
    searchGeo() {
      // Do Nominatim and Mangrove server uncertain viscinity/fragment text search.
      return [];
    },
    searchLei(query) {
      return this.axios
        .get("https://api.gleif.org/api/v1/fuzzycompletions", {
          params: {
            field: "fulltext",
            q: query
          },
          headers: { "Content-Type": "application/vnd.api+json" }
        })
        .then(response => {
          this.error = null;
          return Promise.all(
            response.data.data.map(
              completion =>
                completion.relationships
                  ? this.entityLookup(
                      completion.relationships["lei-records"].data.id
                    )
                      .then(entity => entity.attributes)
                      .then(attrs => {
                        return {
                          uri: `urn:LEI:${attrs.lei}`,
                          scheme: "urn:LEI",
                          description: [
                            attrs.entity.legalName.name,
                            attrs.entity.legalAddress.addressLines,
                            attrs.entity.legalAddress.city,
                            attrs.entity.legalAddress.country
                          ]
                        };
                      })
                  : null // When no related entity return null.
            )
          ).then(entities => {
            // Filter out duplicates and entities without relationship.
            return Array.from(new Set(entities)).filter(
              (entity, index, self) =>
                entity &&
                self.findIndex(e => e && e.uri === entity.uri) === index
            );
          });
        })
        .catch(error => {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.headers);
            this.error = error.response.data;
          } else if (error.request) {
            console.log(error.request);
            this.error = "Server not reachable.";
          } else {
            console.log("Client request processing error: ", error.message);
            this.error = "Internal client error, please report.";
          }
          return [];
        });
    },
    entityLookup(lei) {
      return this.axios
        .get(`https://api.gleif.org/api/v1/lei-records/${lei}`, {
          headers: { "Content-Type": "application/vnd.api+json" }
        })
        .then(response => {
          this.error = null;
          return response.data.data;
        })
        .catch(error => {
          if (error.response) {
            console.log(error.response.status);
            console.log(error.response.headers);
            this.error = error.response.data;
          } else if (error.request) {
            console.log(error.request);
            this.error = "Server not reachable.";
          } else {
            console.log("Client request processing error: ", error.message);
            this.error = "Internal client error, please report.";
          }
        });
    }
  }
};
</script>
