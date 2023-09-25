import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useConnectionStore = defineStore('ConnectionStore', () => {
  const connectionInfo = reactive<{ data: Connection.ConnectionDetail }>({
    data: {
      id: '',
      type: 0,
      name: '',
      username: '',
      password: '',
      masterCluster: {
        hostAndPortVOS: [
          { host: '', port: '' },
        ],
        prometheusUrl: '',
      },
      slaveCluster: {
        hostAndPortVOS: [
          { host: '', port: '' },
        ],
        prometheusUrl: '',
      },
    },
  });

  function setConnection(data: Connection.ConnectionDetail) {
    connectionInfo.data = data;
  }

  return {
    connectionInfo,
    setConnection,
  };
}, {
  persist: {
    storage: sessionStorage,
  },
});

export default useConnectionStore;
