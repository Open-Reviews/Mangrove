<template>
  <v-row>
    <v-col style="height: 95vh" class="overflow-y-auto pl-12">
      <v-row class="px-5">
        <SearchBox />
      </v-row>
      <v-row>
        <SubjectList />
      </v-row>
    </v-col>
    <v-col style="height: 95vh" class="overflow-y-auto pr-12">
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
