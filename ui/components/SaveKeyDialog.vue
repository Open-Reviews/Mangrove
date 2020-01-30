<template>
  <v-dialog value="true" width="600">
    <v-card>
      <v-card-title v-text="submittedTitle" />
      <v-card-text>
        <p v-html="submittedContent" />
        <v-list>
          <v-list-item>
            <v-list-item-action>
              <v-checkbox v-model="savedTick"></v-checkbox>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title class="text-wrap">
                I have saved my password already
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          :disabled="savedTick"
          to="/account"
          color="secondary"
          class="black--text"
          >Go to Account</v-btn
        >
        <v-btn @click.stop="dismiss">Dismiss</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { set } from 'idb-keyval'
import { HAS_SAVED_KEY } from '~/store/indexeddb-types'

// Ideally it should be possible to allow copying the key from here,
// but it for some reason this.$copyText(s) does not copy anything
// when called from within a dialog.
export default {
  props: {
    count: { type: Number, default: () => 0 }
  },
  data() {
    return {
      submittedTitle: 'Thank you for your review!',
      savedTick: false
    }
  },
  computed: {
    countString() {
      if (this.count === 1) {
        return '1 review'
      } else {
        return `${this.count} reviews`
      }
    },
    submittedContent() {
      return `You have left ${this.countString} with this account.
        If you would like to use it in the future, please go to Account to save your password.`
    }
  },
  methods: {
    dismiss() {
      if (this.savedTick) {
        set(HAS_SAVED_KEY, true)
      }
      this.$emit('dismiss')
    }
  }
}
</script>
