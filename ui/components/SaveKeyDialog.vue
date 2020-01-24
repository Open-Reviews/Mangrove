<template>
  <v-dialog value="true" width="600">
    <v-card>
      <v-card-title v-text="submittedTitle" />
      <v-card-text>
        <p v-html="submittedContent" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn to="/settings">Settings</v-btn>
        <v-btn @click.stop="$emit('dismiss')">Dismiss</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {
  html as submittedContent,
  attributes as submittedAttributes
} from '~/content/submitted.md'

// Ideally it should be possible to allow copying the key from here,
// but it for some reason this.$copyText(s) does not copy anything
// when called from within a dialog.
export default {
  data() {
    return {
      submittedTitle: submittedAttributes.title,
      submittedContent
    }
  }
}
</script>
