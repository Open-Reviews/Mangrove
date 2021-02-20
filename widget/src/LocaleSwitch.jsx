import React from 'react';

import i18nConfig from './utils/locales';
import { useI18n } from './i18n';

const { languages, languageLabel } = i18nConfig;

const LocaleSwitch = () => {
  const { locale: setActiveLocale, activeLocale } = useI18n();

  const onLocale = (locale) => {
    const dict = languages[locale];
    setActiveLocale(locale, dict);
  };

  return (
    <div className="or-locale-switch-wrapper">
      {Object.keys(languages).map((key) => (
        <button
          key={`locale-switch-${key}`}
          title={key} // used for testing
          className={`or-button-locale-switch${key === activeLocale ? ' or-button-locale-switch-active' : ''
            }`}
          onClick={() => {
            onLocale(key);
          }}>
          {languageLabel[key]}
        </button>
      ))}
    </div>
  );
};

export default LocaleSwitch;
