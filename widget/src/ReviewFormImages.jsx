import React, { useState, useCallback } from 'react';
import loadImage from 'blueimp-load-image';

import { useI18n } from './i18n';

import { MAX_FILES } from './utils/constants';

import './css/ReviewFormImages.css';

const ReviewFormImage = ({ reviewImages, setReviewFormImages }) => {
  const maxHeight = 1000;
  const maxWidth = 1000;

  const [reviewImagesError, setReviewImagesError] = useState('');
  const { t } = useI18n();

  const resizeFile = (file) => {
    return new Promise((resolve) => {
      loadImage(
        file,
        function (img) {
          img.toBlob(function (blob) {
            resolve(blob);
          }, 'image/jpeg');
        },
        {
          maxWidth,
          maxHeight,
          orientation: true,
          canvas: true,
        }
      );
    });
  };

  const filesSelected = useCallback(
    async (ev) => {
      setReviewImagesError('');

      let files = Array.from(ev.target.files);

      if (files.length + reviewImages.length > MAX_FILES) {
        setReviewImagesError(`${t('frmInfoMaxFiles')}: ${MAX_FILES}`);
      }

      files = files.slice(0, MAX_FILES - reviewImages.length);
      if (!files.length) return;

      const images = await Promise.all(files.map(resizeFile));
      setReviewFormImages(images);
    },
    [reviewImages.length]
  );

  return (
    <>
      <div className="or-review-form-files-title">{t('frmLblUploadImages', { MAX_FILES })}</div>
      <label htmlFor="or-review-form-files">
        <input id="or-review-form-files" type="file" multiple onChange={filesSelected} />
        {reviewImages.length > 0 &&
          reviewImages.map((file) => {
            const src = URL.createObjectURL(file);
            return (
              <div key={src} className="or-review-form-files-image-wrapper">
                <img className="or-review-form-files-image" src={src} />
              </div>
            );
          })}
      </label>

      {reviewImagesError.length > 0 && (
        <div className="or-review-form-files-error">{reviewImagesError}</div>
      )}
    </>
  );
};

export default React.memo(ReviewFormImage);
