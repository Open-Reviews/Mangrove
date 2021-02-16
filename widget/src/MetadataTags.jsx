import React from 'react';

import { useI18n } from './i18n';
import { isPlainObject } from './utils';

const MetadataTags = ({ signature, metadata }) => {
  const { t } = useI18n();

  const tagPills = [];

  const addTag = (key, label) => {
    const { [key]: value } = metadata;
    if (value === undefined) return;

    let labelValue;
    if (typeof label === 'function') labelValue = label(value);
    else if (typeof label === 'string') labelValue = `${label}: ${value}`;
    else if (isPlainObject(label) && value in label) labelValue = label[value];
    else labelValue = value;

    tagPills.push(
      <span key={`${signature}.${key}`} className="or-review-tag">
        {labelValue}
      </span>
    );
  };

  const tags = {
    age: (value) => t('metaAge', { age: value }),
    gender: (value) => (value === 'other' ? '' : t(`metaGender.${value}`)),
    experience_context: (value) => t(`metaContext.${value}`),
    is_affiliated: { true: t('metaIsAffiliated') },
    is_personal_experience: { true: t('metaIsPersonal') },
    is_generated: { true: t('metaGenerated') },
  };

  Object.keys(tags).forEach((key) => addTag(key, tags[key]));

  if (tagPills.length === 0) return null;

  return tagPills;
};

export default MetadataTags;
