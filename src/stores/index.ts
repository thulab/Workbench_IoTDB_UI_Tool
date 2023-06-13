import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { useUserStore } from './user.store';
import { useEnumStore } from './enum.store';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export default pinia;

export {
  useUserStore,
  useEnumStore,
};
