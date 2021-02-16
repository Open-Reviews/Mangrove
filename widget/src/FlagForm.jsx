import React, { useState, useEffect } from 'react';
import FormInput from './FormInput';

import { useGlobalState } from './GlobalState';
import { useI18n } from './i18n';
import { REVIEW_TYPE, MAX_OPINION_LENGTH } from './utils/constants';

import './css/FlagForm.css';

const FlagForm = () => {
  const {
    state: {
      issuer: { metadata: issuerMetadata },
      reviewForm: { busy: reviewFormBusy },
      flagForm: { sub: flagFormSub },
    },
    actions: { onSubmitReview, setFlagFormSub },
  } = useGlobalState();

  const { t } = useI18n();
  const [values, setValues] = useState({
    opinion: '',
    maxlength: MAX_OPINION_LENGTH,
    submit: false,
    disabled: false,
    reasons: {},
  });

  const reasonsSelected = ({ reasons }) => Object.keys(reasons).length;

  useEffect(() => {
    setValues((prevValues) => ({
      ...prevValues,
      maxlength: MAX_OPINION_LENGTH - Object.values(values.reasons).join(' ').length,
      disabled: reasonsSelected(values) >= 3,
      submit: reasonsSelected(values) > 0 || values.opinion.length > 0,
    }));
  }, [Object.keys(values.reasons).length, values.opinion.length]);

  const setValue = (ev, key, v) => {
    ev.persist();
    let value = '';

    if (key === 'reasons') {
      setValues((prevValues) => {
        const { reasons: prevReasons } = prevValues;
        const nextReasons = Object.assign({}, prevReasons);
        const { value: reasonKey, checked } = ev.target;
        if (reasonKey in nextReasons && !checked) delete nextReasons[reasonKey];
        else if (checked) {
          nextReasons[reasonKey] = v;
        }
        return { ...prevValues, reasons: nextReasons };
      });
      return;
    }

    switch (ev.target.type) {
      case 'checkbox':
        value = ev.target.checked;
        break;

      default:
        value = ev.target.value;
        break;
    }

    setValues((prevValues) => ({ ...prevValues, [key]: value }));
  };

  const onFlagFormSubmit = () => {
    const flagValues = {
      ...issuerMetadata,
      rating: 0,
      opinion: `${Object.values(values.reasons).join(' ')} ${values.opinion}`,
    };
    onSubmitReview(flagFormSub, flagValues, REVIEW_TYPE.INAPPROPRIATE);
  };

  const isDisabled = (key) => values.disabled && !(key in values.reasons);

  const formInputReason = (key) => {
    const id = `or-review-form-${key}`;
    return (
      <label className="or-review-form-label-checkbox" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={key in values.reasons}
          disabled={isDisabled(key)}
          value={key}
          onChange={(ev) => setValue(ev, 'reasons', t(`frmFlag.${key}`))}
        />{' '}
        {t(`frmFlag.${key}`)}
      </label>
    );
  };

  return (
    <div className="or-review-form-wrapper">
      <div className="or-review-form-content">
        <div className="or-review-form-title-wrapper">
          <div className="or-review-form-title">{t('frmFlag.title')}</div>
        </div>
        <div className="or-flag-form-info-wrapper">
          <p>{t('frmFlag.info')}</p>
        </div>

        <div className="or-review-form-close">
          <button className="or-review-form-close-button" onClick={() => setFlagFormSub('')}>
            <span />
          </button>
        </div>

        <div className="or-flag-form-reasons-type">{t('frmFlag.typeTerms')}</div>
        <div className="or-flag-form-reasons-wrapper">
          {formInputReason('reason01')}
          {formInputReason('reason02')}
          {formInputReason('reason03')}
        </div>

        <div className="or-flag-form-reasons-type">{t('frmFlag.typeLowQ')}</div>
        <div className="or-flag-form-reasons-wrapper">
          {formInputReason('reason04')}
          {formInputReason('reason05')}
          {formInputReason('reason06')}
        </div>

        <div className="or-flag-form-reasons-type">{t('frmFlag.typeOther')}</div>
        <div className="or-review-form-opinion-wrapper">
          <FormInput
            id="or-review-form-metadata-opinion"
            type="textarea"
            value={values.opinion}
            onChange={(ev) => setValue(ev, 'opinion')}
            rules={{ maxlength: values.maxlength }}
          />
        </div>

        <div className="or-review-form-footer-wrapper">
          <button type="button" onClick={() => setFlagFormSub('')} className="or-base-button">
            {t('cancel')}
          </button>
          <button
            type="button"
            disabled={!values.submit}
            onClick={onFlagFormSubmit}
            className="or-base-button">
            {t('frmFlag.btnSubmit')}
          </button>
        </div>
      </div>

      {reviewFormBusy && (
        <div className="or-review-form-mask">
          <div className="or-loader" />
        </div>
      )}
    </div>
  );
};

export default FlagForm;
