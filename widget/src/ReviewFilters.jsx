import React, { useState, useEffect } from 'react'

import { useGlobalState } from './GlobalState'
import { useI18n } from './i18n'

import './css/ReviewFilters.css'

const ReviewFilters = ({ active, setFilters }) => {
  const {
    state: { reviews, reviewsFiltered, time, config: { blacklist = null } },
  } = useGlobalState()
  const [facetCount, setFacetCount] = useState({})

  if (!Array.isArray(reviews) || reviews.length === 0) return null
  /*
  In general people should be able to filter by
  - number of stars
  - context of reviews (i.e., family, business, etc.)
  - context about the reviewer (gender, age group (e.g., 15-24, 25-34, 35-44, 45-64, 65+)
  */

  const { t } = useI18n()

  const facetLabels = {
    gender: t('facetGender'),
    experience_context: t('facetContenxt'),
    age: t('facetAge'),
    rating: t('facetRating'),
  }

  const blacklistedSignatures = blacklist && blacklist.split(',');

  const whiteListedReviews = blacklistedSignatures ? reviews.filter(review => blacklistedSignatures.indexOf(review.signature) < 0) : reviews;

  const reviewsActive = Object.keys(active).length > 0 ? reviewsFiltered : whiteListedReviews
  useEffect(() => {
    const nextFacetCount = {
      gender: { female: 0, male: 0, other: 0 },
      experience_context: { business: 0, couple: 0, family: 0, friends: 0, solo: 0 },
      age: { '15-24': 0, '25-34': 0, '35-44': 0, '45-64': 0, '65-100': 0 },
      rating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }

    const facetAdd = (k, v) => {
      if (!(k in nextFacetCount)) nextFacetCount[k] = {}
      if (!(v in nextFacetCount[k])) nextFacetCount[k][v] = 1
      else nextFacetCount[k][v] += 1
    }
    const getAgeGroup = (age) => {
      let groupKey
      const groupMax = { 25: '15-24', 35: '25-34', 45: '35-44', 65: '45-64', 90: '65-100' }
      for (const maxAge of Object.keys(groupMax)) {
        if (age < maxAge) {
          groupKey = groupMax[maxAge]
          break
        }
      }
      return groupKey
    }
    const getRatingStars = (rating) => Math.ceil(rating / 20)

    reviewsActive.forEach((review) => {
      const {
        payload: {
          rating,
          metadata: { gender, experience_context, age },
        },
      } = review

      if (gender !== undefined) facetAdd('gender', gender)
      if (experience_context !== undefined) facetAdd('experience_context', experience_context)
      if (age !== undefined) facetAdd('age', getAgeGroup(age))
      if (rating > 0) facetAdd('rating', getRatingStars(rating))
    })

    //sort facets
    for (const k of Object.keys(nextFacetCount)) {
      const facetsForKey = nextFacetCount[k]
      if (facetsForKey) {
        const facetsForKeySorted = sortObject(facetsForKey)
        nextFacetCount[k] = facetsForKeySorted
      }
    }

    setFacetCount(() => nextFacetCount)
  }, [time, reviewsActive.length])

  return (
    <div className="or-review-filters-wrapper">
      {Object.keys(facetCount).map((facet) => {
        const key = `review-facet-${facet}`
        const facetValues = facetCount[facet]
        return (
          <div key={key} className="or-review-filter-content">
            <h3 className="or-review-filter-title">{facetLabels[facet]}</h3>
            <div className="or-review-filter-values">
              {Object.keys(facetValues).map((facetValue) => {
                const classNameActive =
                  facet in active && facetValue in active[facet]
                    ? ' or-review-filter-button-active'
                    : ''
                return (
                  <button
                    key={`${key}.${facetValue}`}
                    disabled={facetValues[facetValue] === 0}
                    className={`or-review-filter-button${classNameActive}`}
                    onClick={() => {
                      setFilters(facet, facetValue)
                    }}>
                    {(() => {
                      switch (facetValue) {
                        case undefined: return ""
                        case "65-100": return "65+"
                        default: return facetValue
                      }
                    })()}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function sortObject(obj) {
  return Object.keys(obj).sort().reduce(function (result, key) {
    result[key] = obj[key]
    return result
  }, {})
}

export default ReviewFilters
