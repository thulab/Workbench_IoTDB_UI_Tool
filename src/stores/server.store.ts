import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useServerStore = defineStore('ServerStore', () => {
  const currentServer = ref<Server.ConnectionInfo>({
    id: 10,
    alias: 'test',
    systemStatus: 'Running',
  });
  const currentServerId = computed(() => currentServer.value?.id);

  return {
    currentServer,
    currentServerId,
  };
});

export default useServerStore;
