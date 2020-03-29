import { SET_FILTER, FETCHED_DISPLAY } from '~/store/mutation-types'

export default function({ store }) {
  store.commit(SET_FILTER, null)
  if (store.state.fetchedDisplay) return
  store.commit(FETCHED_DISPLAY)
  return store.dispatch('saveReviewsWithSubjects', {
    limit: 5,
    opinionated: true
  })
}
