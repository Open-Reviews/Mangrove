<template>
  <v-file-input
    :counter="maxFiles"
    :rules="[isSmallFiles]"
    @change="filesSelected($event)"
    :value="uploadedFiles"
    accept="image/*"
    prepend-icon="mdi-camera-plus"
    clear-icon="mdi-delete-forever"
    multiple
  >
    <template v-slot:selection="{ index }">
      <v-img :src="uploadedLinks[index]" max-width="64" />
      <v-btn @click.stop="$emit('deleted', index)" icon
        ><v-icon align="top">mdi-delete-forever</v-icon></v-btn
      >
    </template>
  </v-file-input>
</template>

<script>
import { imageUrl } from '../utils'
const base64url = require('base64-url')

export default {
  props: {
    extraHashes: Array
  },
  data() {
    return {
      maxFiles: 5,
      isSmallFiles: (fs) =>
        !fs ||
        fs.every((f) => f.size < 5000000) ||
        'Photo should be less than 5 MB',
      uploadFieldName: 'files',
      uploadError: null,
      // Workaround to get individual file uploading work,
      // but keep the parent component as the source of truth.
      hashToFile: {}
    }
  },
  computed: {
    uploadedLinks() {
      return this.extraHashes.map(imageUrl)
    },
    uploadedFiles() {
      return this.extraHashes.map((hash) => this.hashToFile[hash])
    }
  },
  mounted() {
    this.reset()
  },
  methods: {
    reset() {
      // Reset form to initial state.
      this.uploadError = null
    },
    hashFiles(files) {
      return Promise.all(
        files.map((file) =>
          file
            .arrayBuffer()
            .then((array) => crypto.subtle.digest('SHA-256', array))
        )
      )
    },
    upload(formData) {
      return (
        this.$axios
          .put(process.env.VUE_APP_UPLOAD_URL, formData)
          // Add url field.
          .then((response) => response.data)
      )
    },
    save(formData, files) {
      // Wait for upload and hashing.
      Promise.all([this.upload(formData), this.hashFiles(files)])
        .then(([hashes, expectedBuffers]) => {
          // Make sure all returned file hashes are as expected.
          for (let i = 0; i < hashes.length; i++) {
            const expected = base64url.encode(
              new Uint8Array(expectedBuffers[i])
            )
            if (hashes[i] !== expected) {
              throw new Error('Server return unexpected hashes.')
            }
            this.hashToFile[expected] = files[i]
          }
          this.$emit('uploaded', [].concat(hashes))
        })
        .catch((err) => {
          console.log('Error from upload: ', err)
          this.uploadError = err.response
        })
    },
    filesSelected(files) {
      // Handle file changes.
      const formData = new FormData()
      if (!files.length) return
      // Append the files to FormData.
      files.map((file) => {
        formData.append(this.uploadFieldName, file)
      })
      // Save it.
      this.save(formData, files)
    }
  }
}
</script>
