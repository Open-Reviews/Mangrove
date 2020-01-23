<template>
  <v-row>
    <v-col class="scrollable noscroll mr-n3" cols="4">
      <v-row class="px-10">
        <SearchBox />
      </v-row>
      <v-row>
        <SubjectList />
      </v-row>
    </v-col>
    <v-divider vertical />
    <v-col
      style="padding-left: 10vw; padding-right: 15vw"
      class="scrollable noscroll"
    >
      <SubjectProfile />
    </v-col>
  </v-row>
</template>

<script>
import SearchBox from '../components/SearchBox'
import SubjectList from '../components/SubjectList'
import SubjectProfile from '../components/SubjectProfile'

export default {
  components: {
    SearchBox,
    SubjectList,
    SubjectProfile
  },
  middleware: 'search'
}
</script>

<style scoped>
.scrollable {
  height: 95vh;
}
.noscroll {
  overflow-y: scroll;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}
.noscroll::-webkit-scrollbar {
  /* WebKit */
  width: 0;
  height: 0;
}
</style>
