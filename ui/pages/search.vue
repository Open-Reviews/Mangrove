<template>
  <v-row>
    <v-col style="height: 95vh; padding-left: 20vh" class="overflow-y-auto">
      <v-row class="px-5">
        <SearchBox />
      </v-row>
      <v-row>
        <SubjectList />
      </v-row>
    </v-col>
    <v-col style="height: 95vh; padding-right: 20vh" class="overflow-y-auto">
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

<style>
html {
  overflow-y: hidden;
}
</style>
