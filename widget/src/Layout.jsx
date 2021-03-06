import React from 'react';

import { useGlobalState } from './GlobalState';
import { useI18n } from './i18n';

import { isEmptyObject } from './utils';
import { REVIEW_TYPE } from './utils/constants';

import './css/Layout.css';
import './css/Review.css';
import './css/ReviewSignIn.css';
import './css/SubmitReviewPopUp.css';
import './css/RatingStars.css';
import './css/MetadataTags.css';
import 'tippy.js/dist/tippy.css';

import Review from './Review';
import Subject from './Subject';
import Loader from './Loader';
import ReviewForm from './ReviewForm';

import ReviewGallery from './ReviewGallery';
import StatusMessage from './StatusMessage';
import ReviewFilters from './ReviewFilters';
import LocaleSwitch from './LocaleSwitch';
import FlagForm from './FlagForm';
import RawReviewData from './RawReviewData';
import SubmitReviewPopUp from './SubmitReviewPopUp';

const Layout = () => {
  const {
    state: {
      loading,
      reviews,
      reviewsFiltered,
      subject,
      issuers = {},
      subjects = {},
      current,
      config: { sub, reviewsPerPage = 20, language = null },
      reviewForm: { sub: reviewFormSub, type: reviewType },
      issuer: { metadata: issuerMetadata },
      gallery: { images: galleryImages = [], index: galleryIndex = 0 },
      filters: { visible: filtersVisible, active: filtersActive },
      flagForm: { sub: flagFormSub },
      rawReviewData: { signature: rawReviewDataSignature }
    },
    actions: {
      onPageClick,
      setReviewForm,
      setFlagFormSub,
      setRawReviewDataSignature,
      onSubmitReview,
      setGallery,
      setFiltersVisible,
      setFilters,
      clearFilters
    },
  } = useGlobalState();

  const { t } = useI18n();

  const reviewsActive = Object.keys(filtersActive).length > 0 ? reviewsFiltered : reviews;

  const pages = Math.ceil(reviewsActive.length / reviewsPerPage);
  const firstReview = current * reviewsPerPage;
  const reviewsPage = reviewsActive.slice(firstReview, firstReview + reviewsPerPage);

  const reviewFormVisible =
    reviewFormSub.length > 0 &&
    (reviewType === REVIEW_TYPE.REVIEW || reviewType === REVIEW_TYPE.COMMENT);

  const flagFormVisible = flagFormSub.length > 0;
  const rawReviewDataVisible = rawReviewDataSignature.length > 0;
  return (
    <>
      <StatusMessage />
      <SubmitReviewPopUp />
      <div className="or-main-wrapper">
        {loading && <Loader>Loading {sub}</Loader>}

        {!isEmptyObject(subject) && (
          <>
            {language === "selector" && <LocaleSwitch />}
            <Subject />

            {reviewFormVisible && <ReviewForm />}
            {flagFormVisible && <FlagForm />}
            {rawReviewDataVisible && <RawReviewData />}
            {galleryImages.length > 0 && (
              <ReviewGallery images={galleryImages} index={galleryIndex} setGallery={setGallery} />
            )}

            {filtersVisible && <ReviewFilters active={filtersActive} setFilters={setFilters} clearFilters={clearFilters} />}

            <div className="or-subject-navbar">
              <button
                className={`or-review-filters-toggle-button${filtersVisible ? ' or-review-filters-toggle-button-active' : ''
                  }`}
                title={!filtersVisible ? t('showFilters') : t('hideFilters')}
                onClick={() => setFiltersVisible(!filtersVisible)}>
                <span />
              </button>
            </div>

            {reviewsPage.length > 0 && (
              <div className="or-reviews-page-wrapper">
                {reviewsPage.map((item, index) => (
                  <Review
                    key={`review-sig-${item.signature}`}
                    item={item}
                    issuers={issuers}
                    subjects={subjects}
                    issuerMetadata={issuerMetadata}
                    setReviewForm={setReviewForm}
                    setFlagFormSub={setFlagFormSub}
                    setRawReviewDataSignature={setRawReviewDataSignature}
                    setGallery={setGallery}
                    onSubmitReview={onSubmitReview}
                  />
                ))}
              </div>
            )}


            {pages > 1 && (
              <div className="or-subject-paginate-wrapper">
                {[...Array(pages).keys()].map((page) => (
                  <button
                    className={`or-subject-paginate-button${page === current ? ' or-subject-paginate-button--active' : ''
                      }`}
                    key={`page-${sub}-${page}`}
                    onClick={() => {
                      onPageClick(page);
                    }}>
                    {page + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Layout;
