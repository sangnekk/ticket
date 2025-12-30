const config = require('../config.json');
const { Locale } = require('discord.js');
const i18n = require('i18n');

// Định nghĩa các ngôn ngữ hỗ trợ
const Language = {
  Vietnamese: 'Vietnamese',
  English: 'English',
};

function initI18n(client) {
  i18n.configure({
    locales: Object.keys(Language),
    defaultLocale:
      typeof config.defaultLanguage === 'string' ? config.defaultLanguage : 'Vietnamese',
    directory: `${process.cwd()}/locales`,
    retryInDefaultLocale: true,
    objectNotation: true,
    register: global,
    logWarnFn: console.warn,
    logErrorFn: console.error,
    missingKeyFn: (_locale, value) => {
      return value;
    },
    mustacheConfig: {
      tags: ['{', '}'],
      disable: false,
    },
  });

  client.i18n = {
    get: (locale, key) => {
      const prevLocale = i18n.getLocale();
      i18n.setLocale(locale);
      const result = i18n.__mf(key);
      i18n.setLocale(prevLocale);
      return result;
    },
  };

  console.log('I18n has been initialized');
}

function T(locale, text, ...params) {
  i18n.setLocale(locale);
  return i18n.__mf(text, ...params);
}

function localization(lan, name, desc) {
  return {
    name: [Locale[lan], name],
    description: [Locale[lan], T(lan, desc)],
  };
}

function descriptionLocalization(name, text) {
  return i18n.getLocales().map(locale => {
    // Check if the locale is a valid key of the Locale enum
    if (locale in Locale) {
      const localeValue = Locale[locale];
      return localization(localeValue, name, text);
    }
    // If locale is not in the enum, handle it accordingly
    return localization(locale, name, text); // You can choose how to handle this case
  });
}

module.exports = {
  initI18n,
  i18n,
  T,
  localization,
  descriptionLocalization,
  Language,
};
