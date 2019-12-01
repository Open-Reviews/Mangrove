<template>
  <v-expansion-panels>
    <v-expansion-panel v-for="qa in qas" :key="qa.q">
      <v-expansion-panel-header>
        <h4>{{ qa.q }}</h4>
      </v-expansion-panel-header>
      <v-expansion-panel-content
        ><span v-html="qa.a"
      /></v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
export default {
  data() {
    return {
      qas: [
        {
          q: 'How do you avoid spam and ensure reliable reviews and ratings?',
          a:
            'Being an open data set that is maintained in a decentralized manner should not impact the reliability of the data negatively. There should not be a possibility for deletion and censorship of genuine reviews. Fraudulent reviews and irrelevant posts should not be taken into account when composing the rating. Furthermore, the data set should not be a place for hate speech and abuse..'
        },
        {
          q: 'How do I make words in answer bold?',
          a: 'Like <b>this</b>'
        },
        {
          q: 'How do I make a list?',
          a: `
            Here is a few points:
            <ul>
              <li>Item one</li>
              <li>Item two</li>
            </ul>
          `
        },
        {
          q: 'How do I do it b?',
          a: 'Like this'
        },
        {
          q: 'What else?',
          a: 'Nothing.'
        }
      ]
    }
  }
}
</script>
