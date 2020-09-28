import { mount, createLocalVue } from '@vue/test-utils'
import Vue from 'vue'

import Vuex from 'vuex'
import Vuetify from 'vuetify'
import lineClamp from 'vue-line-clamp'
import TopMenu from './TopMenu.vue'

Vue.use(Vuetify)

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(lineClamp)

describe('TopMenu', () => {
  let vuetify
  let propsData
  let store
  const setupComponent = () => {
    return mount(TopMenu, {
      propsData,
      store,
      localVue,
      vuetify,
      stubs: ['router-link', 'nuxt-link']
    })
  }

  beforeEach(() => {
    propsData = {}
    vuetify = new Vuetify()

    store = new Vuex.Store({})
  })

  it('renders <nuxt-link/> e.g. for prefetching', () => {
    const wrapper = setupComponent()
    expect(wrapper.find('nuxt-link-stub').exists()).toBe(true)
  })
})
