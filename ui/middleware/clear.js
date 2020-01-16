import { SET_FILTERS } from '../store/mutation-types'

export default function({ store }) {
  store.commit(SET_FILTERS, [])
}
