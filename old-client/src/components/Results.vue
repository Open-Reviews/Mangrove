<template>
  <div>
    <SearchBox />
    <SubjectList />
    <SubjectProfile />
  </div>
</template>

<script>
import SearchBox from "./search/SearchBox";
import SubjectList from "./SubjectList";
import SubjectProfile from "./search/SubjectProfile";

export default {
  components: {
    SearchBox,
    SubjectList,
    SubjectProfile
  }
};
</script>
