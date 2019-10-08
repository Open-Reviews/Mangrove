<template>
  <div class="container">
    <!--UPLOAD-->
    <form enctype="multipart/form-data" novalidate v-if="isInitial || isSaving">
      <h1>Upload images</h1>
      <div class="dropbox">
        <input
          type="file"
          multiple
          :name="uploadFieldName"
          :disabled="isSaving"
          @change="
            filesChange($event.target.name, $event.target.files);
            fileCount = $event.target.files.length;
          "
          class="input-file"
        />
        <p v-if="isInitial">
          Drag your file(s) here to begin<br />
          or click to browse
        </p>
        <p v-if="isSaving">Uploading {{ fileCount }} files...</p>
      </div>
    </form>
    <!--SUCCESS-->
    <div v-if="isSuccess">
      <h2>Uploaded {{ extraData.length }} file(s) successfully.</h2>
      <p>
        <a href="javascript:void(0)" @click="reset()">Upload again</a>
      </p>
      <ul>
        <li v-for="url in uploadedLinks" :key="url">
          <img :src="url" />
        </li>
      </ul>
    </div>
    <!--FAILED-->
    <div v-if="isFailed">
      <h2>Uploaded failed.</h2>
      <p>
        <a href="javascript:void(0)" @click="reset()">Try again</a>
      </p>
      <pre>{{ uploadError }}</pre>
    </div>
  </div>
</template>

<script>
const BASE_URL = "http://localhost:8001";
const STATUS_INITIAL = 0,
  STATUS_SAVING = 1,
  STATUS_SUCCESS = 2,
  STATUS_FAILED = 3;

export default {
  data() {
    return {
      uploadError: null,
      currentStatus: null,
      uploadFieldName: "files"
    };
  },
  computed: {
    isInitial() {
      return this.currentStatus === STATUS_INITIAL;
    },
    isSaving() {
      return this.currentStatus === STATUS_SAVING;
    },
    isSuccess() {
      return this.currentStatus === STATUS_SUCCESS;
    },
    isFailed() {
      return this.currentStatus === STATUS_FAILED;
    },
    uploadedLinks() {
      return this.extraData.map(hash => `${BASE_URL}/${hash}`);
    },
    extraData: {
      get() {
        return this.$store.state.extraData;
      },
      set(value) {
        this.$store.commit("extraData", value);
      }
    }
  },
  methods: {
    reset() {
      // reset form to initial state
      this.currentStatus = STATUS_INITIAL;
      this.extraData = [];
      this.uploadError = null;
    },
    hashFiles(files) {
      return Promise.all(
        files.map(file =>
          file
            .arrayBuffer()
            .then(array => crypto.subtle.digest("SHA-256", array))
        )
      );
    },
    upload(formData) {
      const url = `${BASE_URL}/upload`;
      return (
        this.axios
          .post(url, formData)
          // add url field
          .then(response => response.data)
      );
    },
    save(formData, expectedHashes) {
      this.currentStatus = STATUS_SAVING;
      // Wait for upload and hashing.
      Promise.all([this.upload(formData), expectedHashes])
        .then(([hashes, expectedBuffers]) => {
          // Make sure all returned file hashes are as expected.
          for (var i = 0; i < hashes.length; i++) {
            let expected = this.$parent.toHexString(
              new Uint8Array(expectedBuffers[i])
            );
            console.log("response: ", hashes[i]);
            console.log("expected: ", expected);
            if (hashes[i] !== expected) {
              throw "Server return unexpected hashes.";
            }
          }
          this.extraData = [].concat(hashes);
          this.currentStatus = STATUS_SUCCESS;
        })
        .catch(err => {
          console.log("Error from upload: ", err);
          this.uploadError = err.response;
          this.currentStatus = STATUS_FAILED;
        });
    },
    filesChange(fieldName, fileList) {
      // handle file changes
      const formData = new FormData();
      if (!fileList.length) return;
      const files = Object.values(fileList);
      // append the files to FormData
      files.map(file => {
        formData.append(fieldName, file);
      });
      // save it
      this.save(formData, this.hashFiles(files));
    }
  },
  mounted() {
    this.reset();
  }
};
</script>
