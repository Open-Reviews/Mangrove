<template>
  <v-container justify="center">
    <v-row>
      <v-text-field
        v-on:keyup.enter="search"
        v-model.trim="query"
        :placeholder="placeholder"
        @click:append="search"
        append-icon="mdi-magnify"
      />
    </v-row>
    <v-alert v-if="error" type="error" border="left" elevation="8">
      Error encountered: {{ error }}
    </v-alert>
    <SchemeFilter v-if="!noFilter" />
  </v-container>
</template>

<script>
import SchemeFilter from './SchemeFilter'

export default {
  components: { SchemeFilter },
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
    error() {
      return this.$store.state.errors.search
    },
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
