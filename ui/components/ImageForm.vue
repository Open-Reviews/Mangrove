<template>
  <div>
    <v-file-input
      :counter="MAX_FILES"
      :rules="[isSmallFiles]"
      @change="filesSelected"
      :value="uploadedFiles"
      accept="image/*"
      prepend-icon="mdi-camera-plus"
      clear-icon="mdi-delete-forever"
      class="mx-2"
      multiple
    >
      <template v-slot:selection="{ index, file }">
        <v-img :src="fileUrl(file)" max-width="64" />
        <v-btn
          @click.stop="
            $emit(
              'input',
              value.filter((_, i) => i !== index)
            )
          "
          icon
          ><v-icon align="top">mdi-delete-forever</v-icon></v-btn
        >
      </template>
    </v-file-input>
  </div>
</template>

<script>
import { imageUrl } from '~/utils'
const base64url = require('base64-url')
const loadImage = require('blueimp-load-image')

function hashFiles(files) {
  return Promise.all(
    files.map((file) =>
      file.arrayBuffer().then((array) => crypto.subtle.digest('SHA-256', array))
    )
  )
}

const MAX_FILES = 5

export default {
  props: {
    value: { type: Array, default: () => [] }
  },
  data() {
    return {
      MAX_FILES,
      isSmallFiles: (fs) =>
        !fs ||
        (fs.length <= MAX_FILES && fs.every((f) => f.size < 10000000)) ||
        'Upload at most 5 photos with each less than 10 MB',
      uploadFieldName: 'files',
      uploadError: null,
      // Workaround to get individual file uploading work,
      // but keep the parent component as the source of truth.
      urlToFile: {},
      maxHeight: 1000,
      maxWidth: 1000,
      fileUrl: (file) => URL.createObjectURL(file)
    }
  },
  computed: {
    uploadedFiles() {
      return this.value.map(({ src }) => this.urlToFile[src])
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
    resizeFile(file) {
      return new Promise((resolve) => {
        loadImage(
          file,
          function(img) {
            img.toBlob(function(blob) {
              resolve(blob)
            }, 'image/jpeg')
          },
          {
            maxWidth: this.maxWidth,
            maxHeight: this.maxHeight,
            orientation: true,
            canvas: true
          }
        )
      })
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
      Promise.all([this.upload(formData), hashFiles(files)])
        .then(([hashes, expectedBuffers]) => {
          const newValue = this.value
          // Make sure all returned file hashes are as expected.
          for (let i = 0; i < hashes.length; i++) {
            const expected = base64url.encode(
              new Uint8Array(expectedBuffers[i])
            )
            if (hashes[i] !== expected) {
              throw new Error('Server return unexpected hashes.')
            }
            files[i].name = expected
            const src = imageUrl(expected)
            this.$set(this.urlToFile, src, files[i])
            if (!this.value.some((img) => img.src === src)) {
              newValue.push({ src })
            }
          }
          this.$emit('input', newValue)
        })
        .catch((err) => {
          console.log('Error from upload: ', err)
          this.uploadError = err.response
        })
    },
    async filesSelected(files) {
      // Handle file changes.
      if (!files.length) {
        this.$emit('input', [])
      }
      // Do not reprocess blobs passed in as input value.
      if (files.some((file) => !file.lastModified)) return
      console.log('rawfiles: ', files)
      const formData = new FormData()
      files = await Promise.all(files.map(this.resizeFile))
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
