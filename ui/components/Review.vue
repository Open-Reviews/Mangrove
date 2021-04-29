<template>
  <v-card light>
    <v-subheader
      v-if="subjectTitle"
      @click="selectSubject()"
      style="cursor: pointer; height: auto!important; line-height: 1.5!important"
      v-line-clamp="1"
      class="pt-3"
    >
      {{ subjectTitle }}
    </v-subheader>
    <UserHeader
      v-if="!isReaction"
      :pk="review.kid"
      :metadata="payload.metadata"
      :count="issuer && issuer.count"
    />
    <v-card-text>
      <v-row v-if="payload.rating !== null" align="center" class="pl-2 pb-1 mb-1">
        <span v-if="isMaresi && payload.rating === 0" class="pl-1"
          ><b>Flagged as inappropriate. &nbsp;</b>
        </span>
        <v-rating
          v-else
          :value="(payload.rating + 25) / 25"
          readonly
          dense
          class="mr-2"
          color="blue"
          background-color="blue"
        />
        <span class="ml-1">{{ dateString }}</span>
      </v-row>
      <span v-line-clamp="dense ? 2 : 20" class="mb-2" style="word-break: break-word!important">
        <span v-html="formattedOpinion" />
      </span>
      <v-row v-if="payload.images" class="py-3">
        <Gallery 
          :images="payload.images" 
          :dense="dense" 
          :maxIcons="dense ? 3 : 0" 
          maxIconHeight="80" 
          maxIconWidth="80" />
      </v-row>
      <div v-if="!hideMetaTags && !isReaction && metadata && metadata.length">
        <v-chip
          v-for="kv in metadata"
          v-text="kv"
          :key="kv[0]"
          outlined
          class="mr-1 mt-3"
          small
        >
        </v-chip>
      </div>
    </v-card-text>
    <v-card-actions v-if="!dense && !isReaction" class="my-n4 ml-4 mx-auto">
      <template v-if="!preview">
        <v-tooltip v-for="action in actions" :key="action.icon" top>
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              @click="action.action(review.signature)"
              :disabled="action.disabled"
              icon
              class="mr-7"
            >
              <v-icon class="mr-2" small>{{ action.icon }}</v-icon>
              {{ action.number }}
            </v-btn>
          </template>
          <span>{{ action.tooltip }}</span>
        </v-tooltip>
        <v-card-text class="ml-n6">
          <div
            v-if="maresiSubject.opinion_count"
            @click="toggleComments"
            style="cursor: pointer"
          >
            {{ commentsVisible ? "Close" : "Read" }} comments
          </div>
        </v-card-text>
      </template>
      <v-spacer />
      <v-menu offset-y close-on-click>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" icon>
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="item in menu"
            :key="item.title"
            @click.stop="item.action(review)"
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-actions>
    <v-dialog :value="raw.jwt" @click:outside="raw.jwt = null" width="600">
      <v-card>
        <v-card-title>
          Raw Mangrove Review
        </v-card-title>
        <v-card-subtitle>
          <a src="https://jwt.io/" target="_blank">JWT</a>
        </v-card-subtitle>
        <v-card-text v-html="raw.jwt" />
        <v-card-subtitle>
          Review data
        </v-card-subtitle>
        <v-card-text v-html="raw.data" />
      </v-card>
    </v-dialog>
    <FlagForm v-model="flagSubject" />
    <ReviewForm v-model="responseDialog" :subject="subjectWithTitle" />
  </v-card>
</template>

<script>
import {
  CLIENT_ID,
  NICKNAME,
  FAMILY_NAME,
  GIVEN_NAME,
  IS_PERSONAL_EXPERIENCE
} from '../store/metadata-types'
import ReviewForm from './ReviewForm'
import FlagForm from './FlagForm'
import UserHeader from './UserHeader'
import Gallery from './Gallery'
import { MARESI, maresiUri } from '~/store/scheme-types'
import { imageUrl, displayName } from '~/utils'

const META_DISPLAY = {
  age: { label: 'Age', postfix: ' years' },
  gender: { label: 'Gender' },
  experience_context: { label: 'Context' },
  is_affiliated: { label: 'Is affiliated' }
}

export default {
  name: 'Review',
  components: {
    ReviewForm,
    FlagForm,
    UserHeader,
    Gallery
  },
  props: {
    review: {
      type: Object,
      default: () => {
        return {
          signature: null,
          payload: { metadata: null, sub: '' },
          jwt: null,
          kid: null
        }
      }
    },
    issuer: Object,
    commentsVisible: Boolean,
    maresiSubject: {
      type: Object,
      default: () => {
        return {}
      }
    },
    preview: Boolean,
    hideMetaTags: Boolean,
    dense: Boolean,
    subjectTitle: {
      type: String,
      default: () => ''
    }
  },
  data() {
    return {
      allMenu: [
        {
          title: 'Flag as inappropriate',
          action: this.showFlag,
          preview: false
        },
        {
          title: 'Show raw Mangrove Review',
          action: this.showRaw,
          preview: true
        },
        {
          title: 'Direct link',
          action: this.goToDirectLink,
          preview: true
        }
      ],
      metadata:
        this.review.payload.metadata &&
        Object.entries(this.review.payload.metadata)
          .filter(
            ([key, _]) =>
              ![CLIENT_ID, NICKNAME, FAMILY_NAME, GIVEN_NAME].some(
                (hidden) => key === hidden
              )
          )
          .map(([k, v]) => {
            console.log(k, v)
            return (
              (META_DISPLAY[k] ? META_DISPLAY[k].label : k) +
              (v === 'true'
                ? ''
                : META_DISPLAY[k] && META_DISPLAY[k].postfix
                ? ': ' + v + META_DISPLAY[k].postfix
                : ': ' + v)
            )
          }),
      raw: { data: undefined, jwt: undefined },
      flagSubject: null,
      personalMeta: { [IS_PERSONAL_EXPERIENCE]: 'true' },
      responseDialog: false
    }
  },
  computed: {
    actions() {
      return [
        {
          icon: 'mdi-thumb-up',
          tooltip: 'This is useful',
          action: this.useful,
          number:
            this.maresiSubject.positive_count -
            this.maresiSubject.confirmed_count,
          disabled: this.review.kid === this.$store.state.publicKey
        },
        {
          icon: 'mdi-certificate',
          tooltip: 'Confirm this experience',
          action: this.confirm,
          number: this.maresiSubject.confirmed_count,
          disabled: this.review.kid === this.$store.state.publicKey
        },
        {
          icon: 'mdi-comment-text-multiple',
          tooltip: 'Write a comment',
          action: this.respond,
          number: this.maresiSubject.opinion_count,
          disabled: false
        }
      ]
    },
    menu() {
      if (this.preview) {
        return this.allMenu.filter(({ preview }) => preview)
      } else {
        return this.allMenu
      }
    },
    payload() {
      return this.review.payload
    },
    subjectWithTitle() {
      return {
        ...this.maresiSubject,
        title: displayName(this.payload.metadata),
        metadata: this.personalMeta
      }
    },
    isMaresi() {
      return this.payload.sub.startsWith(MARESI)
    },
    isReaction() {
      return !this.review.payload.opinion && this.review.scheme === MARESI
    },
    formattedOpinion() {
      if (!this.payload.opinion) return ''
      return (
        this.payload.opinion
          // Make links clickable.
          .replace(/([^\S]|^)(((https?:\/\/)|(www\.))(\S+))/gi, function(
            match,
            space,
            url
          ) {
            let hyperlink = url
            if (!hyperlink.match('^https?://')) {
              hyperlink = 'http://' + hyperlink
            }
            return space + '<a href="' + hyperlink + '">' + url + '</a>'
          })
          // Make new lines appear.
          .replace(/\n/g, '<br />')
      )
    },
    reactionString(){
      if(this.payload.rating === 0){
        return 'Flagged';
      }
      if(this.payload.rating === 100){
        return this.payload.metadata[IS_PERSONAL_EXPERIENCE] ? 'Confirmed' : 'Liked';
      }
    },
    dateString() {
      const [day, month, date, year] = new Date(this.review.payload.iat * 1000).toDateString().split(' ');
      const start = this.review.scheme === MARESI ? (  this.isReaction ? this.reactionString : 'Commented') : 'Reviewed';
      return `${start} on ${day}, ${month} ${date}, ${year}`;
    }
  },
  methods: {
    imageUrl(hash) {
      return imageUrl(hash)
    },
    payloadSub(signature) {
      return { sub: `${MARESI}:${signature}` }
    },
    respond(signature) {
      this.responseDialog = true
    },
    toggleComments() {
      this.$emit('toggleComments')
      this.$store.dispatch(
        'saveReviews',
        this.payloadSub(this.review.signature)
      )
    },
    disableMarking() {
      this.actions[0].disabled = true
      this.actions[1].disabled = true
    },
    useful(signature) {
      const claim = this.payloadSub(signature)
      claim.rating = 100
      this.$store
        .dispatch('submitReview', claim)
        .then(
          (result) =>
            (result && this.actions[0].number++) || this.disableMarking()
        )
    },
    confirm(signature) {
      const claim = this.payloadSub(signature)
      claim.rating = 100
      claim.metadata = this.personalMeta
      this.$store
        .dispatch('submitReview', claim)
        .then(
          (result) =>
            (result && this.actions[1].number++) || this.disableMarking()
        )
    },
    showFlag(review) {
      this.flagSubject = this.subjectWithTitle
    },
    showRaw(review) {
      this.raw.jwt = review.jwt
      this.raw.data = JSON.stringify(
        {
          header: { kid: review.kid },
          payload: review.payload,
          signature: review.signature
        },
        null,
        2
      )
    },
    async goToDirectLink(review) {
      await this.$store.dispatch('selectComment', ['', maresiUri(review.signature)])
    },
    async selectSubject() {
      await this.$store.dispatch(this.isMaresi ? 'selectComment' : 'selectSubject', ['', this.payload.sub])
    }
  }
}
</script>
