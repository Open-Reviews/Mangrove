<template>
  <div>
    <input type="checkbox" id="mine" v-model="onlyMine" />
    <label for="mine">Show only mine</label>
    <br />
    Showing reviews of {{ selectedUri }}
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
  </div>
</template>

<script>
export default {
  data: function() {
    return {
      onlyMine: false
    };
  },
  computed: {
    selectedUri() {
      return this.$store.state.selectedUri;
    },
    reviews() {
      // TODO: Return generator to improve performance.
      return Object.values(this.$store.state.reviews).filter(
        review =>
          (this.selectedUri == null || review.sub === this.selectedUri) &&
          (!this.onlyMine || review.publickey === this.$store.state.publicKey)
      );
    },
    reviewKeys() {
      const first = this.reviews[0];
      return first ? Object.keys(first) : [];
    }
  }
};
</script>
