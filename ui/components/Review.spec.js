import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vue from 'vue'

import Vuex from 'vuex'
import Vuetify from 'vuetify'
import lineClamp from 'vue-line-clamp'
import Review from './Review.vue'

Vue.use(Vuetify)

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(lineClamp)

describe('Review', () => {
  let getters
  let store
  let vuetify

  beforeEach(() => {
    vuetify = new Vuetify()
    getters = {
      state: () => ({
        publicKey: 'abcdefg'
      })
    }

    store = new Vuex.Store({
      getters
    })
  })

  it('renders', () => {
    const wrapper = shallowMount(Review, { store, localVue, vuetify })
    expect(wrapper.find('div').exists()).toBe(true)
  })
})
