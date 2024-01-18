import { createI18n } from 'vue-i18n';
import messages from '@intlify/unplugin-vue-i18n/messages';
import zhLocale from 'element-plus/es/locale/lang/zh-cn';
// import enLocale from 'element-plus/es/locale/lang/en';
// import deLocale from 'element-plus/es/locale/lang/de';
import { langNameMap } from '@/constants';

const locale: 'cn' | 'de' | 'en' = (window?.localStorage?.getItem('lang') || 'cn') as 'cn' | 'de' | 'en';

const i18n = createI18n({
  legacy: false,
  locale: langNameMap[locale],
  fallbackLocale: zhLocale.name,
  messages,
  globalInjection: true,
});

export default i18n;
