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
  }
}
</script>
