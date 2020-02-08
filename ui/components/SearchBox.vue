<template>
  <v-container justify="center">
    <v-row>
      <v-text-field
        v-on:keyup.enter="search"
        v-model.trim="query"
        :placeholder="placeholder"
        @click:append="search"
        @focus="$emit('focus', true)"
        @blur="$emit('focus', false)"
        append-icon="mdi-magnify"
        filled
        outlined
        background-color="white"
        dense
      />
    </v-row>
  </v-container>
</template>

<script>
export default {
  props: {
    noFilter: Boolean
  },
  data() {
    return {
      query: '',
      placeholderIndex: 0,
      placeholders: [
        'Try ‘restaurants in Zurich’ or ‘The Wellington in London',
        'Try ‘quora.com’ or ‘upwork.com’',
        'Try ‘The Age of Surveillance Capitalism’',
        'Try ‘Siemens in Germany’'
      ]
    }
  },
  computed: {
    placeholder() {
      return this.placeholders[this.placeholderIndex]
    }
  },
  mounted() {
    window.setInterval(() => {
      this.nextPlaceholder()
    }, 2000)
    this.query = this.$route.query.q
  },
  methods: {
    search() {
      if (this.query && this.query.length > 0) {
        this.$router.push({ path: 'search', query: { q: this.query } })
      }
    },
    nextPlaceholder() {
      this.placeholderIndex =
        (this.placeholderIndex + 1) % this.placeholders.length
    }
  }
}
</script>
