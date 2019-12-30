<template>
  <v-file-input
    :counter="maxFiles"
    :rules="[isSmallFile]"
    @change="filesSelected($event)"
    accept="image/*"
    prepend-icon="mdi-camera-plus"
    multiple
  >
    <template v-slot:selection="{ index }">
      <v-img :src="uploadedLinks[index]" max-width="64" />
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
      isSmallFile: (fs) =>
        !fs ||
        fs.every((f) => f.size < 5000000) ||
        'Photo should be less than 5 MB',
      uploadFieldName: 'files',
      uploadError: null
    }
  },
  computed: {
    uploadedLinks() {
      return this.extraHashes.map(imageUrl)
    }
  },
  mounted() {
    this.reset()
  },
  methods: {
    reset() {
      // reset form to initial state
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
    deleteHash(index) {
      this.$emit('deleted', index)
    },
    upload(formData) {
      return (
        this.$axios
          .put(process.env.VUE_APP_UPLOAD_URL, formData)
          // add url field
          .then((response) => response.data)
      )
    },
    save(formData, expectedHashes) {
      // Wait for upload and hashing.
      Promise.all([this.upload(formData), expectedHashes])
        .then(([hashes, expectedBuffers]) => {
          // Make sure all returned file hashes are as expected.
          for (let i = 0; i < hashes.length; i++) {
            const expected = base64url.encode(
              new Uint8Array(expectedBuffers[i])
            )
            if (hashes[i] !== expected) {
              throw new Error('Server return unexpected hashes.')
            }
          }
          this.$emit('uploaded', [].concat(hashes))
        })
        .catch((err) => {
          console.log('Error from upload: ', err)
          this.uploadError = err.response
        })
    },
    filesSelected(files) {
      // handle file changes
      const formData = new FormData()
      if (!files.length) return
      // append the files to FormData
      files.map((file) => {
        formData.append(this.uploadFieldName, file)
      })
      // save it
      this.save(formData, this.hashFiles(files))
    }
  }
}
</script>
