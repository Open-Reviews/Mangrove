<template>
  <a :href="dumpUrl">Get all Mangrove data</a>
</template>

<script>
export default {
  data() {
    return {
      dumpUrl: `${process.env.VUE_APP_API_URL}/request`
    }
  }
}
</script>
