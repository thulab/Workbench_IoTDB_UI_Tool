import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { useLoginStore } from './login.store';
import { useEnumStore } from './enum.store';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export default pinia;

export {
  useLoginStore,
  useEnumStore,
};
