<template>
  <v-dialog :value="value" persistent width="600">
    <v-card>
      <v-card-title>
        Flagging a review
      </v-card-title>
      <v-divider />
      <v-card-subtitle>
        Thank you for flagging up inappropriate reviews.
        <b>Reviews that violate the Terms of Use</b> will be removed from the
        dataset. <b>Low-quality reviews</b>
        will remain in the dataset, but will have a reduced influence on the
        overall rating.
        <br />
        Please indicate <b>up to 3 reasons</b> why you are flagging this review
        as inappropriate:
      </v-card-subtitle>
      <v-list dense>
        <v-list-item-group
          v-for="reason in flagReasons"
          :key="reason.description"
        >
          <v-subheader v-html="reason.description" class="mt-n5" />
          <v-list-item v-for="item in reason.items" :key="item">
            <v-list-item-action>
              <v-checkbox
                v-model="selectedReasons"
                :value="item"
                :disabled="
                  selectedReasons.length >= MAX_REASONS_COUNT &&
                    selectedReasons.indexOf(item) === -1
                "
              />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title v-text="item" class="text-wrap" />
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
        <v-subheader>Other</v-subheader>
        <v-list-item>
          <v-textarea
            v-model="otherReason"
            :counter="maxOtherLength"
            :maxlength="maxOtherLength"
          />
        </v-list-item>
      </v-list>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('input', null)" text>
          Cancel
        </v-btn>
        <v-btn
          @click="issueFlag"
          :disabled="!selectedOpinion.length && !otherReason.length"
          text
        >
          Flag as inappropriate
        </v-btn>
      </v-card-actions>
      <v-alert v-if="error" type="error" border="left" elevation="8">
        Error encountered: {{ error }}
      </v-alert>
    </v-card>
  </v-dialog>
</template>

<script>
import { MAX_OPINION_LENGTH } from '~/utils'

export default {
  props: {
    // Subject that can be flagged with this form.
    value: Object
  },
  data() {
    return {
      flagReasons: [
        {
          description: `Violation of the <a to='/terms'>Terms of Service</a>`,
          items: [
            'The review contains offensive language that is violent, unlawful, coarse, sexist, racist, accusatory, or defamatory',
            'The review contains personal information that could be used to track, identify, contact or impersonate someone',
            `The review violates someone else's intellectual property, privacy/confidentiality, or personality rights`
          ]
        },
        {
          description: `Low-quality content`,
          items: [
            `The review is marketing or spam`,
            `The review is on the wrong subject profile`,
            `The content doesn't mention a buying or service experience and is solely ethical, political or value-laden opinion`
          ]
        }
      ],
      // Each item is a vec with two items:
      // rating indicated by reason and the reason description.
      selectedReasons: [],
      otherReason: '',
      rating: null,
      MAX_REASONS_COUNT: 3,
      MAX_OPINION_LENGTH
    }
  },
  computed: {
    selectedOpinion() {
      return this.selectedReasons.join('. ')
    },
    maxOtherLength() {
      return MAX_OPINION_LENGTH - this.selectedOpinion.length
    },
    error() {
      return this.$store.state.errors.submit
    }
  },
  methods: {
    issueFlag() {
      // Rate 0 only in case of violation.
      const rating = this.flagReasons[0].items.filter((value) =>
        this.selectedReasons.includes(value)
      ).length
        ? 0
        : 1
      const claim = {
        sub: this.value.sub,
        metadata: this.value.metadata,
        rating,
        opinion: [this.selectedOpinion, this.otherReason].join('. ')
      }
      this.$store
        .dispatch('submitReview', claim)
        .then((result) => result && this.$emit('input', null))
    }
  }
}
</script>
