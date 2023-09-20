import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useConnectionStore = defineStore('ConnectionStore', () => {
  const connectionInfo = reactive<Connection.ConnectionItem>({
    id: '',
    type: 0,
    name: '',
    username: '',
  });

  function setConnection(data: Connection.ConnectionItem) {
    connectionInfo.id = data.id;
    connectionInfo.type = data.type;
    connectionInfo.name = data.name;
    connectionInfo.username = data.username;
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
