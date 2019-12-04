<template>
  <v-dialog v-model="dialog" persistent>
    <template v-slot:activator="{ on }">
      <v-btn v-on="on">Write a review</v-btn>
    </template>
    <v-card>
      <v-card-title>
        Review {{ $store.state.selected.profile.title }}
      </v-card-title>
      <v-rating v-model="rating" hover />
      <v-textarea
        v-model="opinion"
        label="Describe your experience here"
        counter="500"
        auto-grow
      />
      <MetaForm />
      <v-btn @click.stop="previewReview">Preview</v-btn>
      <v-dialog v-model="preview">
        <v-card>
          <v-card-title>Preview</v-card-title>
          <Review :review="review" preview />
          <v-card-actions>
            <v-spacer />
            <v-btn @click="preview = false" text>Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-card-text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna a
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false" text>
          Cancel
        </v-btn>
        <v-btn @click="submitReview" text>
          Post publicly
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { toHexString } from '../utils'
import MetaForm from './MetaForm'
import Review from './Review'
const cbor = require('cbor')

export default {
  components: {
    MetaForm,
    Review
  },
  data() {
    return {
      dialog: false,
      preview: false,
      rating: null,
      opinion: null,
      review: {}
    }
  },
  methods: {
    reviewContent() {
      // Add mandatory fields.
      const claim = {
        iss: this.$store.state.publicKey,
        iat: Math.floor(Date.now() / 1000),
        sub: this.$store.state.selected.sub
      }
      // Add field only if it is not empty.
      if (this.rating !== null) claim.rating = this.rating * 25 - 25
      if (this.opinion) claim.opinion = this.opinion
      const extradata = this.$store.state.extraHashes
      if (extradata && extradata.length !== 0) claim.extradata = extradata
      const meta = this.$store.state.metadata
      // Remove empty metadata fields.
      Object.keys(meta).forEach((key) => meta[key] == null && delete meta[key])
      if (Object.entries(meta).length !== 0) claim.metadata = meta
      console.log('claim: ', claim)
      const encoded = cbor.encode(claim)
      console.log('msg: ', encoded)
      return window.crypto.subtle
        .sign(
          {
            name: 'ECDSA',
            hash: { name: 'SHA-256' }
          },
          this.$store.state.keyPair.privateKey,
          encoded
        )
        .then((signed) => {
          console.log('sig: ', new Uint8Array(signed))
          return {
            ...claim,
            signature: toHexString(new Uint8Array(signed))
          }
        })
    },
    previewReview() {
      this.reviewContent().then((review) => {
        this.review = review
        this.preview = true
      })
    },
    submitReview() {
      this.reviewContent().then((review) => {
        this.$store.dispatch('submitReview', review)
        this.dialog = false
      })
    }
  }
}
</script>
