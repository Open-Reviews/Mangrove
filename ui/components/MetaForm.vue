<template>
  <div>
    <v-card-subtitle>
      Add <b>optional</b> useful information to publish
    </v-card-subtitle>
    <v-card-text>
      <v-row justify="space-around" class="my-n5">
        <v-col>
          <v-text-field
            v-model="nickname"
            :counter="short_text_length"
            :rules="[is_short_text]"
            label="Nickname"
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
      <v-row justify="space-around" class="my-n5">
        <v-col>
          <v-text-field v-model="age" :rules="[is_age]" label="Your age" />
        </v-col>
        <v-col>
          <v-select v-model="gender" :items="genders" label="Your gender" />
        </v-col>
        <v-col>
          <v-select
            v-model="context"
            :items="contextInput.options"
            :label="contextInput.label"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script>
import { SET_META } from '~/store/mutation-types'
import { GEO, HTTPS, ISBN, LEI } from '~/store/scheme-types'
import {
  AGE,
  NICKNAME,
  FAMILY_NAME,
  GIVEN_NAME,
  GENDER,
  EXPERIENCE_CONTEXT
} from '~/store/metadata-types'

const CONTEXTS = {
  [GEO]: {
    label: 'Context of the experience',
    options: ['business', 'family', 'couple/date', 'friends']
  },
  [HTTPS]: {
    label: 'Context of experience',
    options: ['business', 'private']
  },
  [ISBN]: {
    label: 'Context of reading',
    options: ['education', 'entertainment', 'for kids']
  },
  [LEI]: {
    label: 'My context of experience',
    options: ['customer', 'supplier', 'employee', 'contractor', 'investor']
  }
}

export default {
  props: {
    scheme: {
      type: String,
      default: () => null
    }
  },
  data() {
    return {
      genders: ['female', 'male', 'other'],
      short_text_length: 20,
      is_short_text: (t) =>
        !t || t.length < this.short_text_length || 'Too long',
      is_age: (a) => !a || parseInt(a, 10) < 200 || 'Invalid age'
    }
  },
  computed: {
    contextInput() {
      return CONTEXTS[this.scheme]
    },
    [NICKNAME]: {
      get() {
        return this.$store.state.metadata[NICKNAME]
      },
      set(value) {
        this.$store.commit(SET_META, [NICKNAME, value])
      }
    },
    [AGE]: {
      get() {
        return this.$store.state.metadata[AGE]
      },
      set(value) {
        this.$store.commit(SET_META, [AGE, parseInt(value, 10)])
      }
    },
    [FAMILY_NAME]: {
      get() {
        return this.$store.state.metadata[FAMILY_NAME]
      },
      set(value) {
        this.$store.commit(SET_META, [FAMILY_NAME, value])
      }
    },
    [GIVEN_NAME]: {
      get() {
        return this.$store.state.metadata[GIVEN_NAME]
      },
      set(value) {
        this.$store.commit(SET_META, [GIVEN_NAME, value])
      }
    },
    [GENDER]: {
      get() {
        return this.$store.state.metadata[GENDER]
      },
      set(value) {
        this.$store.commit(SET_META, [GENDER, value])
      }
    },
    context: {
      get() {
        return this.$store.state.metadata[EXPERIENCE_CONTEXT]
      },
      set(value) {
        this.$store.commit(SET_META, [EXPERIENCE_CONTEXT, value])
      }
    }
  }
}
</script>

<style scoped>
.v-expansion-panel:before {
  box-shadow: none !important;
}
</style>
