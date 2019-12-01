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
          q: 'How do I do it belsafla jsdadjlkjaflkja afdsfjl?',
          a:
            'Each Vue instance goes through a series of initialization steps when it’s created - for example, it needs to set up data observation, compile the template, mount the instance to the DOM, and update the DOM when data changes. Along the way, it also runs functions called lifecycle hooks, giving users the opportunity to add their own code at specific stages.'
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
