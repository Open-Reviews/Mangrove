<template>
  <v-list two-line>
    <v-list-item v-for="key in keys" :key="key" @click="">
      <v-list-item-avatar>
        <v-img src="mangrove.png" />
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title>42 reviews · 23 rated useful</v-list-item-title>
        <v-list-item-subtitle>{{
          key.slice(0, 10) + '...'
        }}</v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-action>
        <v-btn icon>
          <v-icon>mdi-content-copy</v-icon>
        </v-btn>
      </v-list-item-action>
    </v-list-item>
  </v-list>
</template>

<script>
export default {
  props: {
    keys: Array
  }
}
</script>
