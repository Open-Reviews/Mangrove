<template>
  <v-row>
    <v-col>
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
