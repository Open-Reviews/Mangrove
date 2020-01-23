<template>
  <v-row>
    <v-col class="scrollable noscroll mr-n3" cols="6">
      <perfect-scrollbar>
        <div style="padding-left: 15vw">
          <v-row class="px-5">
            <SearchBox />
          </v-row>
          <v-row>
            <SubjectList />
          </v-row>
        </div>
      </perfect-scrollbar>
    </v-col>
    <v-col style="padding-right: 15vw" class="scrollable noscroll">
      <SubjectProfile />
    </v-col>
  </v-row>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar'
import SearchBox from '../components/SearchBox'
import SubjectList from '../components/SubjectList'
import SubjectProfile from '../components/SubjectProfile'

export default {
  components: {
    SearchBox,
    SubjectList,
    SubjectProfile,
    PerfectScrollbar
  },
  computed: {
    theme() {
      return this.$vuetify.theme.dark ? 'dark' : 'light'
    }
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
