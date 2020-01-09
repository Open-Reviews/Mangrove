<template>
  <v-dialog v-model="value" persistent width="600">
    <v-card>
      <v-card-title>
        Flagging a review
      </v-card-title>
      <v-divider />
      <v-card-subtitle>
        Thank you for flagging up inappropriate reviews. The Mangrove team will
        remove reviews that breach the Terms of Use from the dataset.
        Low-quality reviews will remain in the dataset, but will have a reduced
        influence on the overall rating.
        <br />
        <br />
        <b>Please indicate your reason to flag this review as inappropriate:</b>
      </v-card-subtitle>
      <v-list>
        <v-list-item-group
          v-for="reason in flagReasons"
          :key="reason.description"
        >
          <v-subheader v-text="reason.description" />
          <v-list-item v-for="item in reason.items" :key="item">
            <v-list-item-action>
              <v-checkbox
                v-model="selectedReasons"
                :value="item"
                :rules="[countCheck]"
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
            :counter="MAX_OPINION_LENGTH - opinion.length"
          />
        </v-list-item>
      </v-list>
      {{ opinion }}
      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('input', null)" text>
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { MAX_OPINION_LENGTH } from '~/utils'

export default {
  props: {
    value: Object
  },
  data() {
    return {
      flagReasons: [
        {
          description: `Violation of the Terms of Use`,
          items: [
            'The review contains offensive language that is violent, coarse, sexist, racist, accusatory, or defamatory',
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
      selectedReasons: [],
      otherReason: '',
      countCheck(input) {
        return input.length <= 3
      },
      MAX_OPINION_LENGTH
    }
  },
  computed: {
    opinion() {
      return this.selectedReasons.concat([this.otherReason]).join('. ')
    }
  }
}
</script>
