import React, { createContext, useState, useContext, useEffect } from 'react'
import { set, get } from 'idb-keyval'
import {
  generateKeypair,
  jwkToKeypair,
  keypairToJwk,
  publicToPem,
  getIssuer,
  getReviews,
  signAndSubmitReview,
} from 'mangrove-reviews'
import base64url from 'base64url'

import { REVIEW_TYPE, STORAGE_KEY, MAX_FILES } from './utils/constants'

export const GlobalStateContext = createContext()

const GlobalStateProvider = ({ config = {}, children }) => {
  const [state, setState] = useState({
    config,
    loading: false,
    reviews: [],
    issuers: {},
    subject: {},
    subjects: {},
    current: 0,
    time: new Date().getTime(),
    showPopUp: false,

    statusMessage: { type: '', message: '' },
    issuer: {
      info: {},
      metadata: {
      },
      JWK: '',
      PEM: '',
    },

    reviewImages: [],

    reviewForm: {
      sub: '',
      type: REVIEW_TYPE.REVIEW,
      metadata: {},
      busy: false,
    },

    flagForm: {
      sub: false,
    },

    rawReviewData: {
      signature: false,
    },

    gallery: {
      images: [],
      index: 0,
    },

    filters: {
      visible: false,
      active: {},
    },
  })

  const actions = {
    onPageClick: (index) => {
      setState((prevState) => ({ ...prevState, current: index }))
    },
    onReviewsRefresh: () => {
      setState((prevState) => ({ ...prevState, time: new Date().getTime() }))
    },
    // incrementing the user count
    setIssuerCount: () => {
      setState((prevState) => ({
        ...prevState,
        issuer: {
          ...prevState.issuer,
          info: { ...prevState.issuer.info, count: prevState.issuer.info.count + 1 },
        },
      }))
    },
    // incrementing the user count
    setIssuerCount: () => {
      setState((prevState) => ({
        ...prevState,
        issuer: {
          ...prevState.issuer,
          info: { ...prevState.issuer.info, count: prevState.issuer.info.count + 1 },
        },
      }));
    },
    setJWK: (JWK) => {
      setState((prevState) => ({ ...prevState, issuer: { ...prevState.issuer, JWK } }))
    },
    //toggle showPopUp
    setShowPopUp: () => {
      setState((prevState) => ({ ...prevState, showPopUp: !prevState.showPopUp }))
    },
    //toggle showPopUp
    setShowPopUp: () => {
      setState((prevState) => ({ ...prevState, showPopUp: !prevState.showPopUp }));
    },
    setPEM: (PEM) => {
      setState((prevState) => ({ ...prevState, issuer: { ...prevState.issuer, PEM } }))
    },
    setReviewFormBusy: (busy) => {
      setState((prevState) => ({ ...prevState, reviewForm: { ...prevState.reviewForm, busy } }))
    },
    setFlagFormSub: (sub) => {
      setState((prevState) => ({ ...prevState, flagForm: { ...prevState.flagForm, sub } }))
    },
    setRawReviewDataSignature: (signature) => {
      setState((prevState) => ({ ...prevState, rawReviewData: { ...prevState.rawReviewData, signature } }))
    },
    setReviewFormSub: (sub) => {
      setState((prevState) => ({
        ...prevState,
        reviewForm: { ...prevState.reviewForm, sub, type: REVIEW_TYPE.REVIEW, metadata: {} },
      }))
    },
    setReviewForm: (sub, type, metadata = {}) => {
      setState((prevState) => ({
        ...prevState,
        reviewForm: { ...prevState.reviewForm, sub, type, metadata },
      }))
    },
    setReviewFormImages: (images) => {
      setState((prevState) => {
        const reviewImages = prevState.reviewImages.concat(images).slice(0, MAX_FILES)
        return { ...prevState, reviewImages }
      })
    },
    setStatusMessage: (statusObject) => {
      setState((prevState) => ({ ...prevState, statusMessage: statusObject }))
    },
    setIssuerMetadata: (metadata) => {
      const nextMetadata = { ...metadata }
      if ('is_personal_experience' in nextMetadata) delete nextMetadata.is_personal_experience
      setState((prevState) => ({
        ...prevState,
        issuer: { ...prevState.issuer, metadata: nextMetadata },
      }))
    },
    setGallery: (images, index) => {
      setState((prevState) => ({ ...prevState, gallery: { images, index } }))
    },
    setFiltersVisible: (visible) => {
      setState((prevState) => ({ ...prevState, filters: { ...prevState.filters, visible } }))
    },
    clearFilters: () => {
      setState((prevState) => {
        return {
          ...prevState,
          filters: { active: {}, visible: true }
        }
      })
    },
    setFilters: (filterKey, filterVal) => {
      setState((prevState) => {
        const {
          reviews = [],
          filters: { active = {} },
        } = prevState
        const nextActive = { ...active }

        if (filterKey in nextActive) {
          if (filterVal in nextActive[filterKey]) {
            delete nextActive[filterKey][filterVal]
            if (Object.keys(nextActive[filterKey]).length === 0) delete nextActive[filterKey]
          } else {
            nextActive[filterKey][filterVal] = true
          }
        } else {
          nextActive[filterKey] = { [filterVal]: true }
        }
        const nextReviews = reviews.filter(({ payload: { rating, metadata } }) => {
          let checkVal = true
          Object.keys(nextActive).forEach((facet) => {
            if (facet === 'age') {
              const facetKeys = Object.keys(nextActive[facet])
              if (!facetKeys.length) return

              checkVal = checkVal && facetKeys.some(ageSpanStr => {
                const [minAge, maxAge] = ageSpanStr.split('-')
                return metadata.age <= maxAge && metadata.age >= minAge
              })
            } else if (facet === 'rating') {
              checkVal =
                checkVal &&
                Object.keys(nextActive[facet]).some(
                  (facetVal) => parseInt(facetVal) === Math.ceil(rating / 20)
                )
            } else if (facet in metadata) {
              checkVal =
                checkVal &&
                Object.keys(nextActive[facet]).some((facetVal) => {
                  return facetVal === metadata[facet]

                })

            } else {
              // if the filter key is not present in the metadata then the review should not be included
              checkVal = false
            }
          })
          return checkVal
        })
        return {
          ...prevState,
          current: 0,
          reviewsFiltered: nextReviews,
          filters: { ...prevState.filters, active: nextActive },
        }
      })
    },
    onLogIn: async (passwd) => {
      try {
        const privateKeyJSON = JSON.parse(passwd)
        const keypair = await jwkToKeypair(privateKeyJSON)
        const PEM = await publicToPem(keypair.publicKey)
        // window.localStorage.setItem(STORAGE_KEY.JWK, passwd)
        set(STORAGE_KEY.JWK, privateKeyJSON)
        setState((prevState) => ({
          ...prevState,
          issuer: { ...prevState.issuer, PEM, JWK: privateKeyJSON },
        }))



        await actions.onGetIssuer(PEM)
        actions.setStatusMessage({ type: 'success', message: 'Key has been updated' })
      } catch (error) {
        actions.setStatusMessage({ type: 'error', message: 'Please provide the right key' })
      }
    },
    onGetIssuer: async (PEM) => {
      let metadata = {}
      const issuerInfo = await getIssuer(PEM, process.env.WIDGET_APP_API_URL)

      if (issuerInfo.count > 0) {
        const issuerReviews = await getReviews(
          {
            kid: PEM,
            limit: 1,
          },
          process.env.WIDGET_APP_API_URL
        );
        ({ reviews: [{ payload: { metadata = {} } = {} }] = [] } = issuerReviews)
      }

      setState((prevState) => ({
        ...prevState,
        issuer: { ...prevState.issuer, info: issuerInfo, metadata },
      }))
    },
    onSubmitReview: async (sub, values, reviewType) => {
      const {
        issuer: { JWK: privateKey },
        reviewImages = [],
      } = state
      const uploadFieldName = 'files'
      const images = []

      actions.setReviewFormBusy(true)
      const hashFiles = (files) =>
        Promise.all(
          files.map((file) =>
            file.arrayBuffer().then((array) => crypto.subtle.digest('SHA-256', array))
          )
        )

      const imageUrl = (hash) => `${process.env.WIDGET_APP_FILES_URL}/${hash}`

      const uploadReviewImages = (formData) =>
        fetch(process.env.WIDGET_APP_UPLOAD_URL, {
          method: 'PUT',
          body: formData,
        }).then((response) => response.json())

      const saveReviewImages = (formData, files) =>
        // Wait for upload and hashing.
        Promise.all([uploadReviewImages(formData), hashFiles(files)])
          .then(([hashes, expectedBuffers]) => {
            // Make sure all returned file hashes are as expected.
            for (let i = 0; i < hashes.length; i++) {
              const expected = base64url.encode(new Uint8Array(expectedBuffers[i]))
              if (hashes[i] !== expected) {
                throw new Error('Server return unexpected hashes.')
              }
              files[i].name = expected
              const src = imageUrl(expected)
              if (!images.some((img) => img.src === src)) {
                images.push({ src })
              }
            }
          })
          .catch(() => { })

      if (reviewImages.length > 0) {
        const formData = new FormData()
        reviewImages.forEach((image) => {
          formData.append(uploadFieldName, image)
        })
        await saveReviewImages(formData, reviewImages)
      }

      try {
        // const privateKeyJSON = JSON.parse(privateKey)
        const keypair = await jwkToKeypair(privateKey)

        const metadata = {};
        ['nickname', 'given_name', 'family_name', 'age', 'gender', 'experience_context'].forEach(
          (key) => {
            if (key in values && values[key].length > 0) metadata[key] = values[key]
          }
        );
        ['is_affiliated', 'is_personal_experience'].forEach((key) => {
          if (key in values && values[key] === true) metadata[key] = 'true'
        })

        if ('age' in metadata) metadata.age = parseInt(metadata.age)
        actions.setIssuerMetadata(metadata)

        const data = {
          sub,
          images,
          metadata,
        }

        if ('rating' in values) data.rating = parseInt(values.rating, 10) * 20
        if ('opinion' in values) data.opinion = values.opinion
        if (data.rating === 0 && reviewType !== REVIEW_TYPE.INAPPROPRIATE) delete data.rating

        await signAndSubmitReview(keypair, data)

        actions.setShowPopUp()
        actions.setReviewFormSub('')
        actions.setFlagFormSub('')
        actions.onReviewsRefresh()
        actions.setIssuerCount()
      } catch (error) {
        let message = ''

        if (error.response) {
          message = error.response.data
        } else if (error.request) {
          message = 'Request error'
        } else {
          message = error && error.message ? error.message : error
        }
        actions.setStatusMessage({ type: 'error', message })
        if (reviewType === REVIEW_TYPE.REVIEW || reviewType === REVIEW_TYPE.COMMENT) {
          actions.setReviewFormSub(sub)
        }
      }
      actions.setReviewFormBusy(false)
    },
  }

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      config: { ...prevState.config, sub: config.sub },
    }))
  }, [config.sub])

  useEffect(() => {
    async function fetchData() {
      setState((prevState) => ({
        ...prevState,
        loading: true,
        reviews: [],
        issuers: [],
        reviewImages: [],
        subject: {},
        subjects: {},
      }))

      const subject = await (
        await fetch(
          `${process.env.WIDGET_APP_API_URL}/subject/${encodeURIComponent(state.config.sub)}`
        )
      ).json()

      const params = new URLSearchParams({
        sub: state.config.sub,
        opinionated: true,
        issuers: true,
        maresi_subjects: true,
      })

      const data = await (
        await fetch(`${process.env.WIDGET_APP_API_URL}/reviews?${params}`)
      ).json()
      const { reviews = [], issuers = {}, maresi_subjects: subjects = {} } = data

      // apply automated filters
      const isReviewAllowed = (review) => {
        // blacklist
        const blacklistedSignatures = state.config.blacklist ? state.config.blacklist.split(',') : [];
        if (blacklistedSignatures.indexOf(review.signature) >= 0) return false
        // filter-opinion
        if (state.config.filterOpinion && !review.payload.opinion) return false
        // filter-anonymous
        const { given_name: giveName, family_name: familyName, nickname } = review.payload.metadata
        if (state.config.filterAnonymous && !giveName && !familyName && !nickname) return false
        return true
      }

      setState((prevState) => ({
        ...prevState,
        loading: false,
        data,
        reviews: reviews.filter(r => isReviewAllowed(r)),
        issuers,
        subject,
        subjects,
      }))
    }

    fetchData()
  }, [state.time, state.config.sub])

  // restore or generate new keypair
  useEffect(() => {
    async function getReviewerKey() {
      // try to get JWK from localStorage
      let JWK = null
      let PEM = null
      let privateKeyJSON = null

      try {
        // JWK = window.localStorage.getItem(STORAGE_KEY.JWK)
        JWK = await get(STORAGE_KEY.JWK).then((jwk) => jwk)
        if (JWK) {
          // privateKeyJSON = JSON.parse(JWK)
          actions.setJWK(JWK)

          const keypair = await jwkToKeypair(JWK)
          PEM = await publicToPem(keypair.publicKey)
          actions.setPEM(PEM)
        }
      } catch (error) {
        actions.setStatusMessage({ type: 'error', message: 'Error getting key' })
      }

      // genereate new keypair
      if (!JWK) {
        console.info('Genereate new keypair...')
        try {
          const keypair = await generateKeypair()
          privateKeyJSON = await keypairToJwk(keypair)
          JWK = privateKeyJSON
          actions.setJWK(JWK)
          // window.localStorage.setItem(STORAGE_KEY.JWK, JWK)
          set(STORAGE_KEY.JWK, JWK)
          PEM = await publicToPem(keypair.publicKey)
          actions.setPEM(PEM)
        } catch (error) {
          actions.setStatusMessage({ type: 'error', message: 'Error generating new keypair' })
        }
      }

      if (PEM) {
        await actions.onGetIssuer(PEM)
      }
    }
    getReviewerKey()
  }, [])


  return (
    <GlobalStateContext.Provider value={{ state, setState, actions }}>
      {children}
    </GlobalStateContext.Provider>
  )
}

export const useGlobalState = () => useContext(GlobalStateContext)
export default GlobalStateProvider
