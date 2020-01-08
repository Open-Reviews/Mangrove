<template>
  <v-expansion-panels class="elevation-0" accordion>
    <v-expansion-panel>
      <v-expansion-panel-header
        >Add some helpful information about yourself</v-expansion-panel-header
      >
      <v-expansion-panel-content>
        <v-container>
          <v-row justify="space-around">
            <v-col>
              <v-text-field
                v-model="display_name"
                :counter="short_text_length"
                :rules="[is_short_text]"
                label="Display name"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model="given_name"
                :counter="short_text_length"
                :rules="[is_short_text]"
                label="Given name"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model="family_name"
                :counter="short_text_length"
                :rules="[is_short_text]"
                label="Family name"
              />
            </v-col>
          </v-row>
          <v-row justify="space-around">
            <v-col>
              <v-text-field v-model="age" :rules="[is_age]" label="Your age" />
            </v-col>
            <v-col>
              <v-select v-model="gender" :items="genders" label="Your gender" />
            </v-col>
            <v-col>
              <v-select
                v-model="context"
                :items="contexts"
                label="Context of the experience"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import { SET_META } from '~/store/mutation-types'

export default {
  data() {
    return {
      contexts: ['Business', 'Private', 'Family', 'Couple/Date', 'Friends'],
      genders: ['Female', 'Male', 'Other'],
      short_text_length: 20,
      is_short_text: (t) =>
        !t || t.length < this.short_text_length || 'Too long',
      is_age: (a) => parseInt(a, 10) < 200 || 'Invalid age'
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
        this.$store.commit(SET_META, ['age', parseInt(value, 10)])
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
        this.$store.commit(SET_META, ['context', value])
      }
    }
  }
}
</script>
