import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UserApi } from '@/api';
import { useRequest } from '@/composition-api';

const { requestFn: getUserPrivileges } = useRequest(UserApi.getUserPrivileges);

export const useUserStore = defineStore('user', () => {
  const userInfo = ref({
    name: '',
  } as {
    name: string;
  });

  const allPrivileges = ref([]);

  function setUser(name: string) {
    userInfo.value.name = name;
  }

  // 加载用户权限
  function loadPrivileges() {
    getUserPrivileges().then((res) => {
      allPrivileges.value = res.data || [];
    });
  }

  return {
    userInfo,
    setUser,
    loadPrivileges,
  };
});

export default useUserStore;
