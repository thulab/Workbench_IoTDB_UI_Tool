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

  const allPrivileges = ref<Auth.UserPrivileges>();
  const privilegesEnum = ref<Auth.PrivilegesEnum>();

  // 权限配置
  // 全局
  const entityPrivilegesEnumGroup = computed(() => privilegesEnum.value?.entityPrivileges || []);
  const entityPrivilegesEnumList = computed(() => entityPrivilegesEnumGroup.value.flatMap((item) => item.children));
  const entityPrivilegesEnumKeys = computed(() => entityPrivilegesEnumList.value.map((item) => item.privileges));

  // 路径
  const pathPrivilegesEnumGroup = computed(() => privilegesEnum.value?.pathPrivileges || []);
  const pathPrivilegesEnumList = computed(() => pathPrivilegesEnumGroup.value.flatMap((item) => item.children));
  const pathPrivilegesEnumKeys = computed(() => pathPrivilegesEnumList.value.map((item) => item.privileges));

  // 当前登录用户权限
  // 全局
  const entityPrivilegesVals = computed(() => allPrivileges.value?.entityPrivileges || []);
  // 路径
  const pathPrivilegesVals = computed(() => allPrivileges.value?.pathPrivileges || []);
  // 角色
  const rolesToPrivilegesVals = computed(() => allPrivileges.value?.rolesToPrivileges || []);
  // 是否开启监控
  const enablePrometheus = computed(() => allPrivileges.value?.enablePrometheus);

  // 加载用户权限
  function loadPrivileges(forceReload?: boolean) {
    if (!forceReload && !userInfo.value.name) return;
    if (forceReload) {
      getLoginUserPrivileges().then((res) => {
        userInfo.value.name = res.data.userName;
        allPrivileges.value = res.data;
      });
    }
  }

  function loadPrivilegesEnum(forceReload?: boolean) {
    if (!userInfo.value.name) return;
    if (forceReload || !entityPrivilegesEnumGroup.value.length) {
      getPrivilegesEnum().then((res) => {
        privilegesEnum.value = res.data;
      });
    }
  }

  loadPrivileges(false);

  function setUser(name: string) {
    userInfo.value.name = name;
    if (name) {
      loadPrivileges(true);
      loadPrivilegesEnum(true);
    }
  }

  function clearUserStore() {
    userInfo.value.name = '';
    allPrivileges.value = undefined;
    privilegesEnum.value = undefined;
  }

  return {
    userInfo,
    enablePrometheus,
    loadPrivileges,
    loadPrivilegesEnum,
    privilegesEnum,
    entityPrivilegesEnumGroup,
    entityPrivilegesEnumList,
    entityPrivilegesEnumKeys,
    pathPrivilegesEnumGroup,
    pathPrivilegesEnumList,
    pathPrivilegesEnumKeys,
    entityPrivilegesVals,
    pathPrivilegesVals,
    rolesToPrivilegesVals,
    setUser,
    clearUserStore,
  };
}, {
  persist: {
    storage: sessionStorage,
    paths: ['privilegesEnum', 'userInfo'],
    afterRestore: (context) => {
      context.store.loadPrivilegesEnum();
    },
  },
});

export default useUserStore;
