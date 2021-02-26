import React, { useEffect, useState } from 'react'

import { useGlobalState } from './GlobalState'

import IssuerName from './IssuerName'
import { useI18n } from './i18n'

import { isTrueStr } from './utils'
import { MAX_OPINION_LENGTH, REVIEW_TYPE } from './utils/constants'

import './css/Loader.css'
import './css/ReviewForm.css'

import ReviewFormImage from './ReviewFormImages'
import FormInput from './FormInput'
import FormRatingStars from './FormRatingStars'
import ReviewSignIn from './ReviewSignIn'

const ReviewForm = () => {
  const {
    state: {
      config: { title: configTitle = '' },
      issuer: { metadata: issuerMetadata },
      reviewForm: {
        sub: reviewFormSub,
        type: reviewType = REVIEW_TYPE.REVIEW,
        metadata: reviewMetadata,
        busy: reviewFormBusy,
      },
      reviewImages,
    },
    actions: { onSubmitReview, setReviewFormSub, setReviewFormImages },
  } = useGlobalState()

  const { t } = useI18n()
  const [values, setValues] = useState({})
  // const [errors, setErrors] = useState({});

  const submitEnabled = ({ agree_terms, agree_license, rating, opinion }) =>
    agree_terms && agree_license && (rating > 0 || opinion.length > 0)

  useEffect(() => {
    const defaultValues = Object.assign(
      {
        rating: 0,
        opinion: '',
        nickname: '',
        given_name: '',
        family_name: '',
        age: '',
        gender: 'other',
        experience_context: '',
        is_affiliated: false,
        is_personal_experience: false,
        agree_terms: false,
        agree_license: false,
        submit: false,
      },
      issuerMetadata
    )

    defaultValues.submit = submitEnabled(defaultValues);
    ['is_affiliated', 'agree_terms', 'agree_license'].forEach((key) => {
      if (key in defaultValues) defaultValues[key] = isTrueStr(defaultValues[key])
    })

    // experience_context should not be copied over from issuerMetaData
    defaultValues.experience_context = '';
    // convert age into a string to be consistent. If age is taken from existing issuer data, then
    // it is an int, which cause it to be skipped in later in onSubmitReview
    if (defaultValues.age) defaultValues.age += '';

    setValues(() => defaultValues)
  }, [JSON.stringify(Object.values(issuerMetadata))])

  useEffect(() => {
    setValues((prevValues) => ({
      ...prevValues,
      submit: submitEnabled(values),
    }))
  }, [values.agree_license, values.agree_terms, values.rating, values.opinion])

  const setValue = (ev, key) => {
    ev.persist()
    let value = ''

    switch (ev.target.type) {
      case 'checkbox':
        value = ev.target.checked
        break

      default:
        value = ev.target.value
        break
    }

    setValues((prevValues) => ({ ...prevValues, [key]: value }))
  }

  let title = ''
  switch (reviewType) {
    case REVIEW_TYPE.COMMENT:
      title = (
        <>
          {t('commentOn')} <IssuerName metadata={reviewMetadata} />
          {t('sbReview')}
        </>
      )
      break

    default:
      title = configTitle ? `${t('reviewOf')} ${configTitle}` : t('reviewOf')
      break
  }

  if (Object.keys(values).length === 0) return null

  return (
    <div className="or-review-form-wrapper">
      <div className="or-review-form-content">
        <div className="or-review-form-title-wrapper">
          <div className="or-review-form-title">{title}</div>
        </div>

        <div className="or-review-form-close">
          <button className="or-review-form-close-button" onClick={() => setReviewFormSub('')}>
            <span />
          </button>
        </div>

        {/* TODO: separate component with better layout */}
        <div className="or-review-form-rating-wrapper">
          <FormRatingStars onChange={(ev) => setValue(ev, 'rating')} value={values.rating} />
        </div>

        <div className="or-review-form-opinion-wrapper">
          <FormInput
            id="or-review-form-metadata-opinion"
            type="textarea"
            label={t('frmOpinion')}
            value={values.opinion}
            onChange={(ev) => setValue(ev, 'opinion')}
            rules={{ maxlength: MAX_OPINION_LENGTH }}
          />
        </div>

        <div className="or-review-form-images-wrapper">
          <ReviewFormImage reviewImages={reviewImages} setReviewFormImages={setReviewFormImages} />
        </div>

        <div className="or-review-form-signin-wrapper">
          <ReviewSignIn metadata={values} />
        </div>

        <div className="or-review-form-metadata-wrapper">
          <div className="or-review-form-metadata-title">{t('addOptionalInfo')}</div>

          <div className="or-review-form-metada">
            <FormInput
              id="or-review-form-metadata-nickname"
              label={t('frmNickname')}
              value={values.nickname}
              onChange={(ev) => setValue(ev, 'nickname')}
              rules={{ maxlength: 20 }}
            />
          </div>

          <div className="or-review-form-metada">
            <FormInput
              id="or-review-form-metadata-given_name"
              label={t('frmGivenName')}
              value={values.given_name}
              placeholder='Anonymous'
              onChange={(ev) => setValue(ev, 'given_name')}
              rules={{ maxlength: 20 }}
            />
          </div>

          <div className="or-review-form-metada">
            <FormInput
              id="or-review-form-metadata-family_name"
              label={t('frmFamilyName')}
              value={values.family_name}
              onChange={(ev) => setValue(ev, 'family_name')}
              rules={{ maxlength: 20 }}
            />
          </div>

          <div className="or-review-form-metada">
            <FormInput
              id="or-review-form-metadata-age"
              label={t('frmAge')}
              type='number'
              max='999'

              value={values.age}
              onChange={(ev) => setValue(ev, 'age')}
              rules={{ maxlength: 3 }}
            />
          </div>

          <div className="or-review-form-metada">
            <label className="or-review-form-label" htmlFor="or-review-form-metadata-gender">
              {t('frmGender')}:
            </label>
            <select
              id="or-review-form-metadata-gender"
              value={!values.gender.length ? 'other' : values.gender}
              onChange={(ev) => setValue(ev, 'gender')} >
              <option value="female">{t('frmGenderFemale')}</option>
              <option value="male">{t('frmGenderMale')}</option>
              <option value="other">{t('frmGenderOther')}</option>
            </select>
          </div>

          <div className="or-review-form-metada">
            <label
              className="or-review-form-label"
              htmlFor="or-review-form-metadata-experience_context">
              {reviewType === REVIEW_TYPE.REVIEW ? t('frmLblContext') : t('frmLblCommenting')}
            </label>
            <select
              id="or-review-form-metadata-experience_context"
              value={values.experience_context}
              onChange={(ev) => setValue(ev, 'experience_context')}>
              <option value=""></option>
              {reviewType === REVIEW_TYPE.REVIEW ? (
                <>
                  <option value="business">{t('metaContext.business')}</option>
                  <option value="family">{t('metaContext.family')}</option>
                  <option value="couple">{t('metaContext.couple')}</option>
                  <option value="friends">{t('metaContext.friends')}</option>
                  <option value="solo">{t('metaContext.solo')}</option>
                </>
              ) : (
                  <>
                    <option value="user">{t('frmExpUser')}</option>
                    <option value="owner">{t('frmExpOwner')}</option>
                  </>
                )}
            </select>
          </div>
        </div>

        <div className="or-review-form-terms-wrapper">
          <label className="or-review-form-label-checkbox" htmlFor="or-review-form-is_affiliated">
            <div className="or-review-form-label-checkbox-inner">
              <input
                id="or-review-form-is_affiliated"
                type="checkbox"
                checked={values.is_affiliated}
                value="1"
                onChange={(ev) => setValue(ev, 'is_affiliated')}
              />{' '}
              {t('frmAffiliated')}
            </div>
          </label>
          <label className="or-review-form-label-checkbox" htmlFor="or-review-form-agree_terms">
            <div className="or-review-form-label-checkbox-inner">
              <input
                id="or-review-form-agree_terms"
                type="checkbox"
                checked={values.agree_terms}
                value="1"
                onChange={(ev) => setValue(ev, 'agree_terms')}
              />{' '}
              {t('frmAgreeTerms')}
            </div>
          </label>
          <label className="or-review-form-label-checkbox" htmlFor="or-review-form-agree_license">
            <div className="or-review-form-label-checkbox-inner">
              <input
                id="or-review-form-agree_license"
                type="checkbox"
                checked={values.agree_license}
                value="1"
                onChange={(ev) => setValue(ev, 'agree_license')}
              />{' '}
              <div>{t('frmAgreeLicense')}</div>
            </div>
          </label>
        </div>

        <div className="or-review-form-footer-wrapper">
          <button type="button" onClick={() => setReviewFormSub('')} className="or-base-button">
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={!values.submit}
            onClick={() => onSubmitReview(reviewFormSub, values, reviewType)}
            className="or-base-button">
            {t('post')}
          </button>
        </div>
      </div>

      {reviewFormBusy && (
        <div className="or-review-form-mask">
          <div className="or-loader" />
        </div>
      )}
    </div>
  )
}

export default ReviewForm
