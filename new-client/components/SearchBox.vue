<template>
  <v-container>
    <v-row>
      <v-col>
        <v-text-field
          v-on:keyup.enter="search"
          v-model.trim="query"
          :placeholder="placeholder"
        />
      </v-col>
      <v-col>
        <v-btn :to="queryLink" :disabled="query == ''">Search</v-btn>
      </v-col>
    </v-row>
    <div v-if="error">Error encountered: {{ error }}</div>
    <SchemeFilter />
  </v-container>
</template>

<script>
import SchemeFilter from './SchemeFilter'

export default {
  components: { SchemeFilter },
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
    queryLink() {
      return `?q=${this.query}`
    },
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
  },
  methods: {
    search() {
      this.$router.push({ path: this.queryLink })
    },
    nextPlaceholder() {
      this.placeholderIndex =
        (this.placeholderIndex + 1) % this.placeholders.length
    }
  }
}
</script>
