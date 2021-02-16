/* eslint-disable object-curly-newline */
import React, { useEffect, useState } from 'react'
import Tippy from '@tippyjs/react'

import { isEmptyObject } from './utils'
import { REVIEW_TYPE } from './utils/constants'
import { useI18n } from './i18n'

import RatingStars from './RatingStars'
import Loader from './Loader'
import IssuerName from './IssuerName'
import IssuerIcon from './IssuerIcon'
import MetadataTags from './MetadataTags'

const Review = ({
  item = {},
  issuers = {},
  subjects = {},
  issuerMetadata = {},
  setReviewForm,
  setFlagFormSub,
  setGallery,
  onSubmitReview,
}) => {
  const [state, setState] = useState({
    visible: false,
    loading: false,
    comments: [],
    issuers: {},
    subjects: {},
  })

  const { t } = useI18n()

  const { signature, payload = {}, kid } = item
  const { opinion, iat, rating, metadata, images = [] } = payload

  const subKey = `urn:maresi:${signature}`
  const {
    [subKey]: {
      opinion_count: opinionCount = 0,
      positive_count: positiveCount = 0,
      confirmed_count: confirmedCount = 0,
    } = {},
  } = subjects

  useEffect(() => {
    async function fetchData() {
      const params = new URLSearchParams({
        sub: subKey,
        issuers: true,
        maresi_subjects: true,
      })

      const data = await (
        await fetch(`${process.env.WIDGET_APP_API_URL}/reviews?${params}`)
      ).json()
      const { reviews = [], issuers = {}, maresi_subjects: subjects = {} } = data

      setState((prevState) => ({
        ...prevState,
        loading: false,
        comments: reviews,
        issuers,
        subjects,
      }))
    }

    if (!state.visible) return
    if (state.comments.length > 0) return

    setState((prevState) => ({
      ...prevState,
      loading: true,
      comments: {},
    }))

    fetchData()
  }, [state.visible])

  const toggleComments = () => {
    setState((prevState) => ({
      ...prevState,
      visible: !prevState.visible,
    }))
  }

  if (isEmptyObject(item)) return null
  if (!opinion) return null

  const { [kid]: { count: reviewCount = 0 } = {} } = issuers || {}

  return (
    <div className="or-review-wrapper" data-testid="or-review">
      <div className="or-review-content">
        <div className="or-review-aside">
          <IssuerIcon kid={kid} metadata={metadata} />
          {reviewCount > 0 && (
            <div className="or-review-count">
              {reviewCount} {t(reviewCount === 1 ? 'review_one' : 'review_other')}
            </div>
          )}
          <div className="or-review-tags">
            <MetadataTags signature={signature} metadata={metadata} />
          </div>
        </div>
        <div className="or-review-main">
          <IssuerName metadata={metadata} />
          <div className="or-review-datetime">Reviewed {new Date(iat * 1000).toDateString()}</div>

          <div className="or-review-rating">
            <RatingStars value={rating} />
          </div>

          {rating !== undefined && rating === 0 && (
            <div className="or-review-flagged">{t('reviewFlagged')}</div>
          )}
          {rating !== undefined && rating === 0 && (
            <div className="or-review-flagged">{t('reviewFlagged')}</div>
          )}
          <p className="or-review-opinion">{opinion}</p>

          {images.length > 0 && (
            <div className="or-review-gallery">
              {images.map((image, index) => (
                <img
                  key={`review-img-${signature}-${index}`}
                  src={image.src}
                  alt=""
                  style={{ maxWidth: '96px', marginRight: '1rem', display: 'inline-block' }}
                  onClick={() => {
                    setGallery(images, index)
                  }}
                />
              ))}
            </div>
          )}

          <div className="or-review-footer">
            <Tippy content={t('reviewOpts.useful')}>
              <button
                className="or-review-btn-thumbup"
                onClick={async () => {
                  await onSubmitReview(
                    subKey,
                    {
                      ...issuerMetadata,
                      rating: 5,
                    },
                    REVIEW_TYPE.POSITIVE
                  )
                }}>
                <span /> {positiveCount}
              </button>
            </Tippy>

            <Tippy content={t('reviewOpts.confirm')}>
              <button
                className="or-review-btn-confirm"
                onClick={async () => {
                  await onSubmitReview(
                    subKey,
                    {
                      ...issuerMetadata,
                      rating: 5,
                      is_personal_experience: true,
                    },
                    REVIEW_TYPE.CONFIRM
                  )
                }}>
                <span /> {confirmedCount}
              </button>
            </Tippy>

            <Tippy content={t('reviewOpts.comment')}>
              <button
                className="or-review-btn-addcomment"
                onClick={() => setReviewForm(subKey, REVIEW_TYPE.COMMENT, metadata)}>
                <span /> {opinionCount}
              </button>
            </Tippy>

            {opinionCount > 0 && (
              <button className="or-review-toggle-comments" onClick={toggleComments}>
                {state.visible ? 'Hide' : 'Show'} comments
              </button>
            )}

            <Tippy content={t('reviewOpts.flag')}>
              <button
                className="or-review-btn-inappropriate"
                onClick={() => setFlagFormSub(subKey)}>
                <span />
              </button>
            </Tippy>
          </div>
        </div>
      </div>

      {state.visible && state.loading && (
        <div className="or-review-wrapper">
          <Loader>loading...</Loader>
        </div>
      )}

      {state.visible &&
        state.comments.length > 0 &&
        state.comments.map((comment) => (
          <Review
            key={comment.signature}
            item={comment}
            issuers={state.issuers}
            subjects={state.subjects}
            issuerMetadata={issuerMetadata}
            setReviewForm={setReviewForm}
            setFlagFormSub={setFlagFormSub}
            onSubmitReview={onSubmitReview}
            setGallery={setGallery}
          />
        ))}
    </div>
  )
}

export default Review
