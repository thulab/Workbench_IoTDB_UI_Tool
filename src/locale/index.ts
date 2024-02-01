import { createI18n } from 'vue-i18n';
import messages from '@intlify/unplugin-vue-i18n/messages';
import zhLocale from 'element-plus/es/locale/lang/zh-cn';
import enLocale from 'element-plus/es/locale/lang/en';
// import deLocale from 'element-plus/es/locale/lang/de';

const locale: 'cn' | 'en' = (window?.localStorage?.getItem('lang') || 'cn') as 'cn' | 'en';

export const langNameMap = {
  cn: zhLocale.name,
  en: enLocale.name,
  // de: deLocale.name,
};

const i18n = createI18n({
  legacy: false,
  locale: langNameMap[locale],
  fallbackLocale: zhLocale.name,
  messages,
  globalInjection: true,
});

export default i18n;
