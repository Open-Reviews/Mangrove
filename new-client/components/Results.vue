<template>
  <v-container>
    <v-row>
      <SearchBox />
    </v-row>
    <v-row>
      <v-col>
        <SubjectList />
      </v-col>
      <v-col>
        <SubjectProfile />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SearchBox from './SearchBox'
import SubjectList from './SubjectList'
import SubjectProfile from './SubjectProfile'

export default {
  components: {
    SearchBox,
    SubjectList,
    SubjectProfile
  }
}
</script>
