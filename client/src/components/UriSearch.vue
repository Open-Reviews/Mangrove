<template>
  <div>
    Search for reviews!
    <input v-model.lazy.trim="query" />
    <button v-on:click="search">Search</button>
    <MapSearch />
    <div v-if="error">Error encountered: {{ error }}</div>
  </div>
</template>

<script>
import { OpenStreetMapProvider } from "leaflet-geosearch";
import MapSearch from "./MapSearch.vue";
import { QUERY, SEARCH_ERROR, ADD_URIS, EMPTY_URIS } from "../mutation-types";

export default {
  components: {
    MapSearch
  },
  data() {
    return {
      geoProvider: new OpenStreetMapProvider()
    };
  },
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
        this.searchGeo(this.query).then(subs =>
          this.$store.commit(ADD_URIS, subs)
        ),
        this.searchLei(this.query).then(subs =>
          this.$store.commit(ADD_URIS, subs)
        )
      ]).then(() => {
        // Try to select the first URI from the list.
        const first = this.$store.state.subs[0];
        if (first) this.$store.dispatch("requestReviews", { sub: first.sub });
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
        ? [{ sub: `${url.protocol}//${url.hostname}`, scheme: url.protocol }]
        : [];
    },
    searchGeo(input) {
      // Do Nominatim and Mangrove server uncertain viscinity/fragment text search.
      return this.geoProvider
        .search({ query: input })
        .then(results =>
          // Compute Geo URI for each result, introducing default uncertainty of the POI of 30 meters.
          results.map(result => {
            let label = encodeURI(result.label.substring(0, result.label.indexOf(",")));
            return {
              sub: `geo:?q=${result.y},${result.x}(${label})&u=30`,
              scheme: "geo",
              description: result.label
            };
          })
        )
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
                          sub: `urn:LEI:${attrs.lei}`,
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
                self.findIndex(e => e && e.sub === entity.sub) === index
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
