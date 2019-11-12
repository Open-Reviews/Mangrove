<template>
  <div>
    <input v-model="displayName" placeholder="pick a name to display" />
    <br />
    <input v-model="age" placeholder="your age" />
    <br />
    <input v-model="lastName" placeholder="your last name" />
    <br />
    <input v-model="firstName" placeholder="your first name" />
    <br />
    <input v-model="gender" placeholder="your gender" />
  </div>
</template>

<script>
export default {
  computed: {
    displayName: {
      get() {
        return this.$store.state.meta.displayName;
      },
      set(value) {
        this.$store.commit("meta", ["displayName", value]);
      }
    },
    age: {
      get() {
        return this.$store.state.meta.age;
      },
      set(value) {
        this.$store.commit("meta", ["age", value]);
      }
    },
    lastName: {
      get() {
        return this.$store.state.meta.lastName;
      },
      set(value) {
        this.$store.commit("meta", ["lastName", value]);
      }
    },
    firstName: {
      get() {
        return this.$store.state.meta.firstName;
      },
      set(value) {
        this.$store.commit("meta", ["firstName", value]);
      }
    },
    gender: {
      get() {
        return this.$store.state.meta.gender;
      },
      set(value) {
        this.$store.commit("meta", ["gender", value]);
      }
    }
  }
};
</script>
