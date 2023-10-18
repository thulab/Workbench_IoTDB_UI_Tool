import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useConnectionStore = defineStore('ConnectionStore', () => {
  const connectionInfo = reactive<{ data: Connection.ConnectionDetail, currentVersion?: string }>({
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
    currentVersion: '',
  });
  const connectionIsMaster = ref();
  const slaveConnectionStatus = ref(true);

  function setConnection(data: Connection.ConnectionDetail) {
    connectionInfo.data = data;
  }

  function setConnectionMasterType(data: boolean) {
    connectionIsMaster.value = data;
  }

  function setSlaveConnectionStatus(data: boolean) {
    slaveConnectionStatus.value = data;
  }

  return {
    connectionInfo,
    setConnection,
    connectionIsMaster,
    setConnectionMasterType,
    slaveConnectionStatus,
    setSlaveConnectionStatus,
  };
}, {
  persist: {
    storage: sessionStorage,
    paths: ['connectionInfo'],
  },
});

export default useConnectionStore;
