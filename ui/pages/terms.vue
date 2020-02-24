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
  }
}
</script>
