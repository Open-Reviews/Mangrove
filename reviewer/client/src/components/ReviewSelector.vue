<template>
  <div>
    Existing review to review:
    <input v-model.lazy.trim="id" />
    <button v-on:click="$parent.request">Search</button>
  </div>
</template>

<script>
export default {
  computed: {
    id: {
      get() {
        return this.$store.state.id;
      },
      set(value) {
        this.$store.commit("id", value);
      }
    }
  }
};
</script>
