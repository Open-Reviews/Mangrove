<template>
  <v-list-item @click.stop="select">
    <v-list-item-avatar class="mr-2 ml-auto" tile>
      <Identicon :seed="pk" />
    </v-list-item-avatar>
    <v-list-item-content>
      <v-list-item-title class="headline">{{ name }}</v-list-item-title>
      <v-list-item-subtitle>{{ count }} reviews </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>

<script>
import Identicon from './Identicon'
import { displayName } from '~/utils'

export default {
  components: {
    Identicon
  },
  props: {
    pk: String,
    metadata: Object,
    count: { type: Number, default: () => 0 },
    placeholder: { type: String, default: () => undefined }
  },
  computed: {
    name() {
      return displayName(this.metadata, this.placeholder)
    }
  },
  methods: {
    select() {
      this.$router.push({ path: 'list', query: { kid: this.pk } })
    }
  }
}
</script>
