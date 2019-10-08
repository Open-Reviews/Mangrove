<template>
  <span v-if="$store.state.reviews[0]">
    Reviews of {{ $store.state.id }}
    <table>
      <thead>
        <tr>
          <th v-for="key in reviewKeys" :key="key">{{ key }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in $store.state.reviews" :key="entry[reviewKeys[0]]">
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
    reviewKeys: function() {
      return Object.keys(this.$store.state.reviews[0]);
    }
  }
};
</script>
