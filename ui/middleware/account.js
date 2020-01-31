import { SET_FILTER } from '../store/mutation-types'

export default function({ store }) {
  store.commit(SET_FILTER, null)
  return store.dispatch('saveMyReviews')
}
