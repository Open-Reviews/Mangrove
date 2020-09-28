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
  let propsData
  const setupComponent = () => {
    return shallowMount(Review, {
      propsData,
      store,
      localVue,
      vuetify
    })
  }

  beforeEach(() => {
    propsData = {}
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

  it('renders some text', () => {
    const wrapper = setupComponent()
    expect(wrapper.text()).toContain('Raw Mangrove Review')
  })

  describe('given a subjectTitle', () => {
    beforeEach(() => {
      propsData = {
        subjectTitle: 'I am a subject'
      }
    })
    it('displays subject', () => {
      const wrapper = setupComponent()
      expect(wrapper.text()).toContain('I am a subject')
    })
  })
})
