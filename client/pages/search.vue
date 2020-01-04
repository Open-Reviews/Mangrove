<template>
  <v-row>
    <v-col style="height: 90vh;width: 40vw" class="overflow-y-auto">
      <v-row>
        <SearchBox />
      </v-row>
      <v-row>
        <SubjectList />
      </v-row>
    </v-col>
    <v-col>
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
