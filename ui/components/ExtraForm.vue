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
    <v-alert v-if="isMobileFirefox" type="warning" elevation="8" border="left">
      Image upload may not work on Firefox Mobile.
    </v-alert>
  </div>
</template>

<script>
import { isMobileFirefox } from '~/utils'
const base64url = require('base64-url')

function dataURIToBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  const byteString = atob(dataURI.split(',')[1])

  // separate out the mime component
  const mimeString = dataURI
    .split(',')[0]
    .split(':')[1]
    .split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  const ab = new ArrayBuffer(byteString.length)

  // create a view into the buffer
  const ia = new Uint8Array(ab)

  // set the bytes of the buffer to the correct values
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }

  // write the ArrayBuffer to a blob, and you're done
  const blob = new Blob([ab], { type: mimeString })
  return blob
}

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
      hashToFile: {},
      maxHeight: 600,
      maxWidth: 600,
      fileUrl: (file) => URL.createObjectURL(file),
      isMobileFirefox
    }
  },
  computed: {
    uploadedFiles() {
      return this.value.map((hash) => this.hashToFile[hash])
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
        const reader = new FileReader()
        reader.onload = (readerEvent) => {
          const image = new Image()
          image.onload = (imageEvent) => {
            // Resize the image
            const canvas = document.createElement('canvas')
            let width = image.width
            let height = image.height
            if (width > height) {
              if (width > this.maxWidth) {
                height *= this.maxWidth / width
                width = this.maxWidth
              }
            } else if (height > this.maxHeight) {
              width *= this.maxHeight / height
              height = this.maxHeight
            }
            canvas.width = width
            canvas.height = height
            const context = canvas.getContext('2d')
            context.drawImage(image, 0, 0, width, height)
            const dataUrl = canvas.toDataURL('image/jpeg')
            const resizedImage = dataURIToBlob(dataUrl)
            resolve(resizedImage)
          }
          image.src = readerEvent.target.result
        }
        reader.readAsDataURL(file)
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
            this.$set(this.hashToFile, expected, files[i])
            if (!this.value.includes(expected)) {
              newValue.push(expected)
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
