<template>
  <v-row
    v-if="selected || display"
    justify="center"
    style="position: relative"
    class="pa-1"
  >
    <vl-map
      ref="map"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      :style="`height: ${isSmall ? 300 : 400}px`"
      data-projection="EPSG:4326"
      class="mx-3"
    >
      <vl-view :center="display ? [0, 0] : selected" :zoom="display ? 1 : 15" />

      <vl-interaction-select
        @update:features="$emit('select', $event[0] && $event[0].id)"
      />

      <vl-feature v-for="(p, i) in points" :key="i" :id="p.id">
        <vl-geom-point :coordinates="p.coordinates" />
        <vl-style-box>
          <vl-style-icon
            :scale="p.coordinates === selected ? 1.2 : 0.7"
            :anchor="[0.5, 1]"
            src="map-marker.png"
          />
        </vl-style-box>
      </vl-feature>

      <vl-layer-tile id="osm">
        <vl-source-osm />
      </vl-layer-tile>
    </vl-map>
    <v-btn
      @click="geoSearch"
      v-if="!display"
      class="ma-3"
      absolute
      style="background: rgb(255, 255, 255, 0.7)"
      >Search selected area</v-btn
    >
  </v-row>
</template>

<script>
import { transformExtent, get } from 'ol/proj'

export default {
  props: {
    // Selected coordinates.
    selected: {
      type: Array,
      default: () => null
    },
    display: Boolean,
    // Any other points to display for possible selection.
    // { coordinates, id }
    points: {
      type: Array,
      default: () => null
    }
  },
  computed: {
    isSmall() {
      return this.$vuetify.breakpoint.smAndDown
    }
  },
  methods: {
    geoSearch() {
      this.$emit(
        'search',
        transformExtent(
          this.$refs.map.$map.getView().calculateExtent(),
          get('EPSG:3857'),
          get('EPSG:4326')
        )
      )
    }
  }
}
</script>
