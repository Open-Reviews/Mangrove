import { SET_FILTER } from '~/store/mutation-types'

export default function({ store }) {
  store.commit(SET_FILTER, null)
  if (Object.entries(store.state.reviews).length >= 5) return
  return store.dispatch('saveReviewsWithSubjects', { limit: 5 })
}
