import { useI18n } from 'vue-i18n';
import type { Composer } from 'vue-i18n';
import { langMap, langIndexMap, langName } from '@/constants';

export function useLangSwitch(i18n: Composer) {
  const lang = langMap[(localStorage.getItem('lang') || 'cn') as 'cn' | 'en' | 'de'];
  const langIndex = ref(lang);
  const handleLangCommand = (val: '0' | '1' | '2') => {
    localStorage.setItem('lang', langIndexMap[val]);
    langIndex.value = +val;
    i18n.locale.value = langName[val];
  };
  return {
    langIndex,
    handleLangCommand,
  };
}

export function useLangSwitched(callback: Function, init: boolean = false) {
  const { locale } = useI18n();
  watch(locale, () => {
    nextTick(() => {
      if (callback) callback();
    });
  });
  if (init) {
    nextTick(() => {
      if (callback) callback();
    });
  }
}

export default { useLangSwitched };
