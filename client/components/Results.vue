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
