import { createI18n } from 'vue-i18n';
import messages from '@intlify/unplugin-vue-i18n/messages';
import { LOCALE } from '@/constants';

const locale = window.localStorage.getItem('locale') || LOCALE.ZH_CN;

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: LOCALE.ZH_CN,
  messages,
  globalInjection: true,
});

export default i18n;
