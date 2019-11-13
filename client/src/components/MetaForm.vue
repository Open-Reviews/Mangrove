<template>
  <div>
    <input v-model="nickname" placeholder="pick a name to display" />
    <br />
    <input v-model="age" placeholder="your age" />
    <br />
    <input v-model="family_name" placeholder="your last name" />
    <br />
    <input v-model="given_name" placeholder="your first name" />
    <br />
    <input v-model="gender" placeholder="your gender" />
  </div>
</template>

<script>
import { SET_META } from "../mutation-types";

export default {
  computed: {
    nickname: {
      get() {
        return this.$store.state.meta.nickname;
      },
      set(value) {
        this.$store.commit(SET_META, ["nickname", value]);
      }
    },
    age: {
      get() {
        return this.$store.state.meta.age;
      },
      set(value) {
        this.$store.commit(SET_META, ["age", value]);
      }
    },
    family_name: {
      get() {
        return this.$store.state.meta.family_name;
      },
      set(value) {
        this.$store.commit(SET_META, ["family_name", value]);
      }
    },
    given_name: {
      get() {
        return this.$store.state.meta.given_name;
      },
      set(value) {
        this.$store.commit(SET_META, ["given_name", value]);
      }
    },
    gender: {
      get() {
        return this.$store.state.meta.gender;
      },
      set(value) {
        this.$store.commit(SET_META, ["gender", value]);
      }
    }
  }
};
</script>
