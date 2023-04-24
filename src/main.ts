import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import pinia from '@/stores';
import baseComponents from '@/components';
import i18n from '@/locale';

import '@/styles/main.scss';

const VITE_APP_VERSION = __APP_VERSION__;

const vers = window.localStorage.getItem('appVersion');
if (VITE_APP_VERSION !== vers) {
  localStorage.clear();
  localStorage.setItem('appVersion', VITE_APP_VERSION);
  window.location.reload();
}

const app = createApp(App);

app.use(i18n);
app.use(pinia);
app.use(router);
app.use(baseComponents);

router.isReady().then(() => {
  app.mount('#app');
});
