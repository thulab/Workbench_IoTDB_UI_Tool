import { defineStore } from 'pinia';
import { AlarmApi } from '@/api';

const { requestFn: getConfigEnum } = useRequest(AlarmApi.getConfigEnum);

export const useEnumStore = defineStore('EnumStore', () => {
  const allEnum = ref<Record<string, any>>({});

  function loadAllEnum() {
    getConfigEnum().then((res) => {
      allEnum.value = res.data;
    });
  }

  return {
    allEnum,
    loadAllEnum,
  };
}, {
  persist: {
    storage: sessionStorage,
  },
});

export default useEnumStore;
