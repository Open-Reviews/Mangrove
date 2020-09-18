import { shallowMount } from '@vue/test-utils'
import Review from './Review.vue'

describe('Review', () => {
  it('renders', () => {
    const wrapper = shallowMount(Review)
    expect(wrapper.contains('div')).toBe(true)
  })
})


