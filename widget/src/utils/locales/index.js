import en from './en.json';
import de from './de.json';
import fr from './fr.json';
import pl from './pl.json';
import pt from './pt.json';

const i18nConfig = {
  fallbackLanguage: 'en',
  languages: { en, de, fr, pl, pt },
  languageLabel: {
    en: 'en',
    de: 'de',
    fr: 'fr',
    pl: 'pl',
    pt: 'pt',
  },
  getPrefferedLang: (lngOverride) => {
    let prefLang =
      navigator.languages && navigator.languages.length
        ? navigator.languages[0]
        : navigator.language;

    lngOverride = lngOverride && Object.keys(i18nConfig.languages).find((key) => lngOverride.indexOf(key) === 0);

    let availLang = lngOverride || Object.keys(i18nConfig.languages).find((key) => prefLang.indexOf(key) === 0);

    if (!availLang) availLang = i18nConfig.fallbackLanguage;

    return [availLang, i18nConfig.languages[availLang]];
  },
};

export default i18nConfig;
