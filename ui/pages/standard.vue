<template>
  <MdText :html="html" />
</template>

<script>
import { html } from '../../Mangrove_Review_Standard.md'
import MdText from '~/components/MdText'

export default {
  components: {
    MdText
  },
  data() {
    return { html }
  },
  head() {
    return {
      title: 'Mangrove Review Standard (MaReSt)',
      meta: [
        {
          name: 'description',
          content:
            'To enable interoperability, we need agreed-upon technical standards. Therefore, the Mangrove initiative proposes the Mangrove Review Standard as a way for people to represent insights in the form of reviews. We invite the Open and Privacy communities to contribute to this standard.'
        }
      ]
    }
  }
}
</script>
