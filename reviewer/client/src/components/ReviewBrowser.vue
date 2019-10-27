<template>
  <span v-if="reviews[0]">
    Showing reviews of {{ $store.state.selectedUri }}
    <table>
      <thead>
        <tr>
          <th v-for="key in reviewKeys" :key="key">{{ key }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in reviews" :key="entry[reviewKeys[0]]">
          <td v-for="key in reviewKeys" :key="key">
            {{ entry[key] | truncate(20) }}
          </td>
        </tr>
      </tbody>
    </table>
    <br />
  </span>
</template>

<script>
export default {
  computed: {
    reviews: function() {
      return this.$store.state.reviews;
    },
    reviewKeys: function() {
      return Object.keys(this.reviews[0]);
    }
  }
};
</script>
