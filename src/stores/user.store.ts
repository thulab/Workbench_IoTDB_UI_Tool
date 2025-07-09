import { defineStore } from 'pinia';
import { ref } from 'vue';
import { union, difference } from 'lodash-es';
import { UserApi, DashboardApi } from '@/api';
import { useRouter } from 'vue-router';
import { useConnectionStore } from './connection.store';

const { requestFn: getLoginUserPrivileges } = useRequest(UserApi.getLoginUserPrivileges);
const { requestFn: getPrivilegesEnum } = useRequest(UserApi.getPrivilegesEnum);
const { requestFn: getSystemInfo } = useRequest(DashboardApi.getSystemInfo);

export const useUserStore = defineStore(
  'UserStore',
  () => {
    const connectionStore = useConnectionStore();
    const router = useRouter();

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
    // 是否配置监控
    const configurePrometheus = computed(() => allPrivileges.value?.configurePrometheus);

    // 用户+角色 全局权限
    const userAllEntityPrivileges = computed(() => {
      const roleEntityPrivileges: string[] = (allPrivileges.value?.rolesToPrivileges || []).flatMap((item) => item.entityPrivileges);
      const result = union(allPrivileges.value?.entityPrivileges, roleEntityPrivileges);
      return result;
    });

    /**
     * 角色路径权限，合并到一起。独立计算属性（计算属性有缓存，角色不变，这里就不变）
     */
    const rolePathPrivileges = computed(() => {
      const result: Array<{ path: string; privileges: string[] }> = [];
      allPrivileges.value?.rolesToPrivileges?.forEach((role) => {
        role.pathPrivileges.forEach((item) => {
          const pathData = result.find((pathItem) => pathItem.path === item.path);
          if (!pathData) {
            result.push({
              path: item.path,
              privileges: item.privileges,
            });
          } else {
            pathData.privileges = union(pathData.privileges, item.privileges);
          }
        });
      });
      return result;
    });

    // 用户+角色 路径权限
    const userAllPathPrivileges = computed(() => {
      const rolePaths = rolePathPrivileges.value.map((item) => item.path);
      const userPrivileges = allPrivileges.value?.pathPrivileges || [];
      difference(
        rolePaths,
        userPrivileges.map((item) => item.path)
      ).forEach((path) => {
        userPrivileges.push({ path, privileges: [] });
      });

      const result: Array<{ path: string; privileges: string[] }> = userPrivileges.map((item) => ({
        path: item.path,
        privileges: item.privileges,
      }));

      rolePathPrivileges.value?.forEach((item) => {
        const pathData = result.find((pathItem) => pathItem.path === item.path);
        if (pathData) {
          pathData.privileges = union(pathData.privileges || [], item.privileges);
        }
      });
      return result;
    });

    // 用户+角色 所有权限
    const userAllPrivileges = computed(() => {
      const allPathPrivileges: string[] = (userAllPathPrivileges.value || []).flatMap((item) => item.privileges);
      const result = union(userAllEntityPrivileges.value, allPathPrivileges);
      return result;
    });

    const canManageDatabase = computed(() => userAllEntityPrivileges.value.includes('MANAGE_DATABASE'));
    const canWriteSchema = computed(() => userAllEntityPrivileges.value.includes('WRITE_SCHEMA'));
    const canWriteData = computed(() => userAllEntityPrivileges.value.includes('WRITE_DATA'));
    const canReadWriteSchema = computed(() => userAllPrivileges.value.includes('READ_SCHEMA') || userAllPrivileges.value.includes('WRITE_SCHEMA'));
    const canReadWriteData = computed(() => userAllPrivileges.value.includes('READ_DATA') || userAllPrivileges.value.includes('WRITE_DATA'));
    const canReadWriteSchemaData = computed(
      () =>
        userAllPrivileges.value.includes('READ_SCHEMA') ||
        userAllPrivileges.value.includes('WRITE_SCHEMA') ||
        userAllPrivileges.value.includes('READ_DATA') ||
        userAllPrivileges.value.includes('WRITE_DATA')
    );
    const canUsePipe = computed(() => userAllEntityPrivileges.value.includes('USE_PIPE'));
    const canManageUser = computed(() => userAllEntityPrivileges.value.includes('MANAGE_USER'));
    const canManageRole = computed(() => userAllEntityPrivileges.value.includes('MANAGE_ROLE'));
    const canMaintain = computed(() => userAllEntityPrivileges.value.includes('MAINTAIN'));
    const canUseModel = computed(() => userAllEntityPrivileges.value.includes('USE_MODEL'));

    function clearUserStore() {
      userInfo.value.name = '';
      allPrivileges.value = undefined;
      privilegesEnum.value = undefined;
    }

    function loadPrivilegesEnum(forceReload?: boolean) {
      if (!userInfo.value.name) return;
      if (forceReload || !entityPrivilegesEnumGroup.value.length) {
        getPrivilegesEnum().then((res) => {
          privilegesEnum.value = res.data;
        });
      }
    }

    // 加载用户权限
    function loadPrivileges(forceReload?: boolean) {
      if (!forceReload && !userInfo.value.name) return;
      if (forceReload) {
        getLoginUserPrivileges()
          .then((res) => {
            userInfo.value.name = res.data.userName;
            allPrivileges.value = res.data;
            sessionStorage.setItem('iotdbVersion', res.data.version);
            connectionStore.connectionInfo.currentVersion = res.data.version;
            connectionStore.connectionInfo.slaveVersion = res.data.slaveVersion;
            connectionStore.setConnection(res.data.connection);
            connectionStore.setConnectionMasterType(res.data.isMaster);
            connectionStore.setConnectionActive(res.data.isActive);
            connectionStore.setModel(res.data.model);
            connectionStore.setSlaveConnectionStatus(res.data.slaveIsConnection);
            loadPrivilegesEnum(false);
            getSystemInfo(['type', 'type'], ['', '']).then((systemInfoResp) => {
              if (!systemInfoResp.data.masterNodeInfo?.nodes) {
                connectionStore.setMasterConnectionStatus(false);
              }
              if (systemInfoResp.data.masterNodeInfo?.nodes?.some((i) => i.type === 'AINode' && i.status.toLowerCase() !== 'unknown')) {
                connectionStore.setEnableAINode(true);
              } else {
                connectionStore.setEnableAINode(false);
              }
            });
          })
          .catch(() => {
            clearUserStore();
            sessionStorage.setItem('UserStore', '');
            sessionStorage.setItem('nologin', '1');
            router.push({
              name: 'Login',
              query: {
                timestamp: new Date().getTime(),
              },
            });
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

    return {
      userInfo,
      enablePrometheus,
      configurePrometheus,
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
      userAllEntityPrivileges,
      userAllPathPrivileges,
      userAllPrivileges,
      canManageDatabase,
      canWriteSchema,
      canWriteData,
      canReadWriteSchema,
      canReadWriteData,
      canReadWriteSchemaData,
      canUsePipe,
      canManageUser,
      canManageRole,
      canMaintain,
      setUser,
      clearUserStore,
      canUseModel,
    };
  },
  {
    persist: {
      storage: sessionStorage,
      pick: ['privilegesEnum', 'userInfo'],
      afterHydrate: (context) => {
        context.store.loadPrivilegesEnum();
      },
    },
  }
);

export default useUserStore;
