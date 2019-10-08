<template>
  <div>
    <l-map :zoom="zoom" :center="center">
      <l-tile-layer :url="url"></l-tile-layer>
    </l-map>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer } from "vue2-leaflet";

export default {
  components: { LMap, LTileLayer },
  data() {
    return {
      zoom: 13,
      center: [47.41322, -1.219482],
      url: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
    };
  }
};
</script>
