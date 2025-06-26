import { defineStore } from 'pinia';
import { reactive, computed } from 'vue';

export const useConnectionStore = defineStore(
  'ConnectionStore',
  () => {
    const connectionInfo = reactive<{ data: Connection.ConnectionDetail; currentVersion?: string; slaveVersion?: string }>({
      data: {
        id: '',
        type: 0,
        name: '',
        username: '',
        password: '',
        masterCluster: {
          hostAndPortVOS: [{ host: '', port: '' }],
          prometheusUrl: '',
        },
        slaveCluster: {
          hostAndPortVOS: [{ host: '', port: '' }],
          prometheusUrl: '',
        },
      },
      currentVersion: '',
      slaveVersion: '',
    });
    const connectionIsMaster = ref();
    const connectionIsActive = ref<boolean | null>(null);
    const masterConnectionStatus = ref(true);
    const slaveConnectionStatus = ref(true);
    const enableAINode = ref(false);
    const model = ref<'tree' | 'table'>('tree');

    function setConnection(data: Connection.ConnectionDetail) {
      connectionInfo.data = data;
    }

    function setConnectionMasterType(data: boolean) {
      connectionIsMaster.value = data;
    }

    function setConnectionActive(data: boolean | null) {
      connectionIsActive.value = data;
    }
    function setMasterConnectionStatus(data: boolean) {
      masterConnectionStatus.value = data;
    }

    function setSlaveConnectionStatus(data: boolean) {
      slaveConnectionStatus.value = data;
    }

    function setEnableAINode(data: boolean) {
      enableAINode.value = data;
    }

    const isTableModel = computed(() => {
      return model.value === 'table';
    });

    const setModel = (payload: 'tree' | 'table') => {
      model.value = payload;
    };

    return {
      connectionInfo,
      setConnection,
      connectionIsMaster,
      setConnectionMasterType,
      connectionIsActive,
      setConnectionActive,
      slaveConnectionStatus,
      setSlaveConnectionStatus,
      masterConnectionStatus,
      setMasterConnectionStatus,
      enableAINode,
      setEnableAINode,
      model,
      isTableModel,
      setModel,
    };
  },
  {
    persist: {
      storage: sessionStorage,
      pick: ['connectionInfo', 'enableAINode'],
    },
  }
);

export default useConnectionStore;
