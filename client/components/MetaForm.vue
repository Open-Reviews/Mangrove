<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header
        >You can provide additional information</v-expansion-panel-header
      >
      <v-expansion-panel-content>
        <v-container>
          <v-row>
            <v-col>
              <v-select
                v-model="context"
                :items="contexts"
                label="Context of the experience"
              />
            </v-col>
            <v-col>
              <v-textarea v-model="age" label="Age" />
            </v-col>
            <v-col>
              <v-select v-model="gender" :items="genders" label="Gender" />
            </v-col>
          </v-row>
        </v-container>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import { SET_META } from '../store/mutation-types'

export default {
  data() {
    return {
      contexts: ['Business', 'Private', 'Family', 'Couple/Date', 'Friends'],
      genders: ['Female', 'Male', 'Other']
    }
  },
  computed: {
    display_name: {
      get() {
        return this.$store.state.metadata.display_name
      },
      set(value) {
        this.$store.commit(SET_META, ['display_name', value])
      }
    },
    age: {
      get() {
        return this.$store.state.metadata.age
      },
      set(value) {
        this.$store.commit(SET_META, ['age', value])
      }
    },
    family_name: {
      get() {
        return this.$store.state.metadata.family_name
      },
      set(value) {
        this.$store.commit(SET_META, ['family_name', value])
      }
    },
    given_name: {
      get() {
        return this.$store.state.metadata.given_name
      },
      set(value) {
        this.$store.commit(SET_META, ['given_name', value])
      }
    },
    gender: {
      get() {
        return this.$store.state.metadata.gender
      },
      set(value) {
        this.$store.commit(SET_META, ['gender', value])
      }
    },
    context: {
      get() {
        return this.$store.state.metadata.context
      },
      set(value) {
        this.$store.commit(SET_META, ['cotext', value])
      }
    }
  }
}
</script>
