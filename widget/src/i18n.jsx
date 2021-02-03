import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import rosetta from 'rosetta';
import parse from 'html-react-parser';

// https://github.com/zeit/next.js/tree/canary/examples/with-i18n-rosetta
// import rosetta from 'rosetta/debug';
import i18nConfig from './utils/locales';

const i18n = rosetta();

export const I18nContext = createContext();

// default language
const { fallbackLanguage } = i18nConfig;
i18n.locale(fallbackLanguage);

const I18n = ({ children, locale, lngDict }) => {
  const activeLocaleRef = useRef(locale || fallbackLanguage);
  const [, setTick] = useState(0);
  const firstRender = useRef(true);

  // TODO add lang specific Plural formulas
  // http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html
  // pl: plural = (n) => (n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2); -> [one, few, other]

  const i18nWrapper = {
    activeLocale: activeLocaleRef.current,
    t: (...args) => parse(i18n.t(...args)),
    locale: (l, dict) => {
      i18n.locale(l);
      activeLocaleRef.current = l;
      if (dict) {
        i18n.set(l, dict);
      }
      // force rerender to update view
      setTick((tick) => tick + 1);
    },
  };

  // for initial SSR render
  if (locale && firstRender.current === true) {
    firstRender.current = false;
    i18nWrapper.locale(locale, lngDict);
  }

  // when locale is updated
  useEffect(() => {
    if (locale) {
      i18nWrapper.locale(locale, lngDict);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lngDict, locale]);

  return <I18nContext.Provider value={i18nWrapper}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
export default I18n;
