import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import pinia from '@/stores';
import baseComponents from '@/components';
import i18n from '@/locale';

import 'virtual:uno.css';
import '@/styles/main.scss';

const VITE_APP_VERSION = __APP_VERSION__;

const vers = window.localStorage.getItem('appVersion');
if (VITE_APP_VERSION !== vers) {
  localStorage.clear();
  localStorage.setItem('appVersion', VITE_APP_VERSION);

  window.__isReload__ = true;
  window.location.reload();
}

const app = createApp(App);

app.use(i18n);
app.use(pinia);
app.use(router);
app.use(baseComponents);

app.directive('copy', {
  beforeMount(el, binding) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(binding.value);
        ElMessage.success(app.config.globalProperties.$t('flow.copySuccess'));
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = binding.value;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          ElMessage.success(app.config.globalProperties.$t('flow.copySuccess'));
        } catch {
          ElMessage.error(app.config.globalProperties.$t('flow.copyFailed'));
        }
        document.body.removeChild(textarea);
      }
    });
  },
});

router.isReady().then(() => {
  app.mount('#app');
});
