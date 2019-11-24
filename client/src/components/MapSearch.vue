<template>
  <div v-if="center">
    <l-map style="height: 300px; width: 100%" :zoom="zoom" :center="center">
      <l-tile-layer
        url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
      ></l-tile-layer>
    </l-map>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { LMap, LTileLayer } from "vue2-leaflet";

const COORDS_REGEX = new RegExp(/q=([+-]?\d+(?:\.\d+)?)\,([+-]?\d+(?:\.\d+)?)/);

export default {
  components: { LMap, LTileLayer },
  data() {
    return {
      geosearchOptions: {
        provider: new OpenStreetMapProvider()
      },
      zoom: 18
    };
  },
  computed: {
    center() {
      const uri = this.$store.state.selectedUri;
      if (uri && uri.startsWith("geo")) {
        const captures = uri.match(COORDS_REGEX);
        return [captures[1], captures[2]];
      }
    }
  }
};
</script>
