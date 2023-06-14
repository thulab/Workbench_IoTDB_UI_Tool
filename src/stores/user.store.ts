import { defineStore } from 'pinia';
import { ref } from 'vue';
import { UserApi } from '@/api';

const { requestFn: getLoginUserPrivileges } = useRequest(UserApi.getLoginUserPrivileges);
const { requestFn: getPrivilegesEnum } = useRequest(UserApi.getPrivilegesEnum);

export const useUserStore = defineStore('UserStore', () => {
  const userInfo = ref({
    name: '',
  } as {
    name: string;
  });

  const allPrivileges = ref<Auth.LoginUserPrivileges>();
  const privilegesEnum = ref<Auth.PrivilegesEnum>();

  // 权限配置
  const entityPrivilegesConfig = computed(() => privilegesEnum.value?.entityPrivileges);
  const entityPrivilegesKeys = computed(() => Object.keys(entityPrivilegesConfig.value || {}) || []);
  const pathPrivilegesConfig = computed(() => privilegesEnum.value?.pathPrivileges);
  const pathPrivilegesKeys = computed(() => Object.keys(pathPrivilegesConfig.value || {}) || []);

  // 当前登录用户权限
  // 全局
  const entityPrivilegesVals = computed(() => allPrivileges.value?.entityPrivileges || []);
  // 路径
  const pathPrivilegesVals = computed(() => allPrivileges.value?.pathPrivileges || []);
  // 角色
  const rolesToPrivilegesVals = computed(() => allPrivileges.value?.rolesToPrivileges || []);

  // 加载用户权限
  function loadPrivileges(forceReload?: boolean) {
    if (forceReload || !userInfo.value.name) {
      getLoginUserPrivileges().then((res) => {
        userInfo.value.name = res.data.userName;
        allPrivileges.value = res.data;
      });
    }
  }

  function loadPrivilegesEnum(forceReload?: boolean) {
    if (forceReload || !entityPrivilegesConfig.value) {
      getPrivilegesEnum().then((res) => {
        privilegesEnum.value = res.data;
      });
    }
  }

  loadPrivileges();

  return {
    userInfo,
    loadPrivileges,
    loadPrivilegesEnum,
    privilegesEnum,
    entityPrivilegesConfig,
    entityPrivilegesKeys,
    pathPrivilegesConfig,
    pathPrivilegesKeys,
    entityPrivilegesVals,
    pathPrivilegesVals,
    rolesToPrivilegesVals,
  };
}, {
  persist: {
    storage: sessionStorage,
    paths: ['privilegesEnum'],
    afterRestore: (context) => {
      context.store.loadPrivilegesEnum();
    },
  },
});

export default useUserStore;
