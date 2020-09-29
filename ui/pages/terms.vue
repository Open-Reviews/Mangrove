<template>
  <MdText :html="html" />
</template>

<script>
import MdText from '~/components/MdText'
import { html } from '~/content/Mangrove_Original_Services_ToS.md'

export default {
  components: {
    MdText
  },
  data() {
    return { html }
  },
  head() {
    return {
      title: 'Terms of Service and Privacy Policy',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'These Terms of Service tell you about the services that the Mangrove initiative provides, our relationship to you as a User, and the rights and responsibilities that guide us both. We want you to know that we host an increasingly growing quantity of informational content, all of which is contributed and made possible by users like yourself.'
        }
      ]
    }
  }
}
</script>
