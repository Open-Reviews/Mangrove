import { SET_FILTER } from '~/store/mutation-types'

export default function({ store, route }) {
  store.commit(SET_FILTER, null)
  return store.dispatch('saveReviewsWithSubjects', route.query)
}
