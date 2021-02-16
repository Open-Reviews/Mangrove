import React, { useState } from 'react';
import { useGlobalState } from './GlobalState';
import { useI18n } from './i18n';

const SubmitReviewPopUp = () => {
  const [checkMark, setCheckMark] = useState('');
  const { t } = useI18n();
  const {
    state: {
      issuer: {
        info: { count },
        JWK,
      },
      showPopUp,
    },
    actions: { setShowPopUp },
  } = useGlobalState();
  const saveToClipboard = () => {
    navigator.clipboard.writeText(JWK);
    setCheckMark('✓');
  };
  return (
    showPopUp && (
      <div className="or-submit-review-popup" onClick={() => setShowPopUp(false)}>
        <div className="or-submit-review-popup-container" onClick={(e) => e.stopPropagation()}>
          <button className="or-submit-review-popup-button" onClick={() => setShowPopUp(false)}>
            X
          </button>
          {count === 1 ? (
            <>
              <h3>{t('popupHeader')}</h3>
              <p>{t('popupContent')}</p>
              <button
                className="or-base-button"
                onClick={saveToClipboard}
                onMouseOut={() => setTooltipText('Copy')}>
                {t('popupButton')}
                <span className="or-submit-review-popup-checkmark">{checkMark}</span>
              </button>
            </>
          ) : (
            <>
              <h3>{t('popupHeader')}</h3>
            </>
          )}
        </div>
      </div>
    )
  );
};

export default SubmitReviewPopUp;
