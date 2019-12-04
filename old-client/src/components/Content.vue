<template>
  <div>
    <Front v-if="$store.state.content == c.FRONT" />
    <Results v-else-if="$store.state.content == c.RESULTS" />
    <Static v-else />
  </div>
</template>

<script>
import * as c from "../content-types";
import Front from "./Front";
import Results from "./Results";
import Static from "./static/MdText";
export default {
  components: {
    Front,
    Results,
    Static
  },
  data: function() {
    return {
      c
    };
  }
};
</script>
