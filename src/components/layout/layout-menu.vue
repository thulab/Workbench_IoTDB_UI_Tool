<template>
  <div
    class="menu"
    :style="{ width: isCollapse ? '40px' : '216px' }">
    <div class="logo flex-align-center" :style="{ paddingLeft: isCollapse ? '6px' : '14px' }" id="layout-menu-logo" @click="handleDashboard">
      <el-icon alt="logo" v-if="isCollapse"><i-custom-logo /></el-icon>
      <el-icon class="title" v-if="!isCollapse"><i-custom-timecho-logo-white /></el-icon>
      <!-- <span v-show="!isCollapse">{{ systemTitle }}</span> -->
    </div>
    <div class="connection-box" :style="{ padding: isCollapse ? '0 0 0 5px' : '0 16px 0 10px' }">
      <div class="connection-divider"></div>
      <div class="flex-align-center" style="height: 40px;">
        <el-icon size="30" :style="{ marginLeft: isCollapse ? '0' : '-4px' }"><i-custom-connection /></el-icon>
        <div v-if="!isCollapse" class="connection-info flex-align-center">
          <span class="connection-name">{{ connectionName }}</span>
          <el-icon size="20" style="cursor: pointer;" id="layout-menu-connection" @click="handleToggleConnection"><i-custom-toggle /></el-icon>
        </div>
      </div>
      <div v-if="!isCollapse" class="flex-align-center" style="height: 36px;">
        <div class="connection-host-box flex-align-center">
          <el-icon size="30" style="margin-right: 4px;" v-if="connectionStore.connectionInfo.data.type !== 2">
            <i-custom-menu-connection-stand-alone v-if="connectionStore.connectionInfo.data.type === 0" />
            <i-custom-menu-connection-cluster v-if="connectionStore.connectionInfo.data.type === 1" />
          </el-icon>
          <ul class="cluster-list" v-else>
            <li :class="['cluster-type', { 'cluster-active': clusterType === 'master' }]" id="layout-menu-connection-master" @click="handleChangeCluster('master')">主</li>
            <li :class="['cluster-type', { 'cluster-active': clusterType === 'slave' }]" id="layout-menu-connection-slave" @click="handleChangeCluster('slave')">备</li>
          </ul>
          <span class="connection-host-port">{{ connectionHost }}</span>
        </div>
      </div>
    </div>
    <el-scrollbar :style="{ height: !isCollapse ? 'calc(100% - 124px)' : 'calc(100% - 88px)' }">
      <el-menu
        :default-active="activeMenu"
        :router="true"
        :collapse="isCollapse"
        :collapse-transition="false"
        :default-openeds="['/system/auth']"
        :unique-opened="false">
        <layout-menu-sub-item :menu-list="menuList" :show-auth-menu="true" />
      </el-menu>
    </el-scrollbar>

    <modal-connection
      v-model:visible="connectionVisible"
      :is-toggle="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { type RouteRecordRaw, useRoute, useRouter } from 'vue-router';
// import { storeToRefs } from 'pinia';
import useMenuStore from '@/stores/menu';
import { useConnectionStore } from '@/stores';
// import useAppStore from '@/stores/app';
import { ConnectionApi } from '@/api';
import ModalConnection from '@/components/modal-connection.vue';
// import { iotdbShowAuth } from '@/utils/auth';
import LayoutMenuSubItem from './components/layout-menu-sub-item.vue';

// const appStore = useAppStore();

// const { systemTitle } = storeToRefs(appStore);
const { t } = useI18n();
const connectionStore = useConnectionStore();
const route = useRoute();
const menuStore = useMenuStore();
const router = useRouter();
const allRoutes = computed(() => router.options.routes);
const connectionVisible = ref(false);
// 因趋势 监听主备集群 websocket 会调用两次，不设置默认值，菜单侧因主备集群其一未能正常使用，接口返回慢，此处设置默认为'master'。
const clusterType = computed(() => {
  if (typeof connectionStore.connectionIsMaster === 'boolean') {
    return connectionStore.connectionIsMaster ? 'master' : 'slave';
  }
  return 'master';
});
const connectionName = computed(() => connectionStore.connectionInfo.data.name || '连接实例');
const slaveConnectionStatus = computed(() => connectionStore.slaveConnectionStatus);
const connectionHost = computed(() => {
  const { type, masterCluster, slaveCluster } = connectionStore.connectionInfo.data;
  if (type === 2 && clusterType.value === 'slave' && slaveCluster) {
    return `${slaveCluster.hostAndPortVOS[0].host}:${slaveCluster.hostAndPortVOS[0].port}`;
  }
  return `${masterCluster.hostAndPortVOS[0].host}:${masterCluster.hostAndPortVOS[0].port}`;
});

// const showAuthMenu = computed(() => iotdbShowAuth(connectionStore.connectionInfo.currentVersion));

const { requestFn: changeCluster } = useRequest(ConnectionApi.changeCluster);

const getRoutePath = (routeItem: RouteRecordRaw, parentPath: string) => {
  const path = routeItem.path.indexOf('/') === 0 ? routeItem.path : `${parentPath}/${routeItem.path}`;
  return path.replaceAll('//', '/');
};

const routesToMenu = (routeItem: RouteRecordRaw, parentPath: string) => {
  const path = getRoutePath(routeItem, parentPath);
  const menu = {
    path,
    title: routeItem.meta?.title,
    icon: routeItem.meta?.icon,
    activeIcon: routeItem.meta?.activeIcon,
    isLink: routeItem.meta?.isLink,
    close: routeItem.meta?.close,
    alwayShow: routeItem.meta?.alwayShow,
    order: routeItem.meta?.order,
    hideLine: routeItem.meta?.hideLine,
    showTopLine: routeItem.meta?.showTopLine,
    isAuthMenu: routeItem.meta?.isAuthMenu,
  } as MenuOptions;
  if (routeItem.children && routeItem.children.length > 0) {
    if (routeItem.children.length === 1 && !routeItem.meta?.alwayShow && (!routeItem.children[0].children?.length || routeItem.children[0].children?.length <= 1)) {
      menu.path = getRoutePath(routeItem.children[0], path);
    } else {
      const routesHasTitle = routeItem.children.filter((item) => item?.meta?.title && !item.meta?.hiddenMenu);
      routesHasTitle.forEach((item) => {
        if (!menu.children) {
          menu.children = [];
        } menu.children.push(routesToMenu(item, menu.path));
      });
    }
  }
  return menu;
};

function handleChangeCluster(type: 'master' | 'slave') {
  if (!slaveConnectionStatus.value) {
    ElMessageBox.alert('备集群状态异常，请检查后重试', t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      confirmButtonClass: 'change-slave-error-confirm',
      type: 'warning',
      showClose: false,
    });
  } else {
    changeCluster(type === 'master' ? 0 : 1).then(() => {
      window.location.reload();
    });
  }
}

const getMenuList = () => {
  const menuList = [] as Array<MenuOptions>;
  const routesHasTitle = allRoutes.value.filter((item) => item?.meta?.title && !item.meta?.hiddenMenu);
  routesHasTitle.forEach((item) => {
    menuList.push(routesToMenu(item, ''));
  });

  return menuList;
};

function handleDashboard() {
  router.push({ name: 'Dashboard' });
}

function handleToggleConnection() {
  connectionVisible.value = true;
}

onMounted(async () => {
  menuStore.setMenuList(getMenuList());
});

const activeMenu = computed((): string => route.path);
const isCollapse = computed((): boolean => menuStore.isCollapse);
const menuList = computed((): MenuOptions[] => menuStore.menuList);

const screenWidth = ref<number>(0);
const screenHeight = ref<number>(0);
// 监听窗口大小
const listeningWindow = () => {
  window.onresize = () => (() => {
    screenWidth.value = document.body.clientWidth;
    screenHeight.value = document.body.clientHeight;
    if (isCollapse.value === false && screenWidth.value < 1200) menuStore.setCollapse();
    if (isCollapse.value === true && screenWidth.value > 1200) menuStore.setCollapse();
  })();
};
listeningWindow();

</script>

<style scoped lang="scss">
.menu {
  --el-menu-active-color: #131926;
  --el-menu-text-color: #131926;
  --el-menu-hover-text-color: #131926;
  --el-menu-bg-color: #fff;
  --el-menu-hover-bg-color: #f7f8fc;
  --el-menu-item-height: 40px;
  --el-menu-sub-item-height: var(--el-menu-item-height);
  --el-menu-horizontal-sub-item-height: 36px;
  --el-menu-item-font-size: var(--el-font-size-base);
  --el-menu-item-hover-fill: var(--el-color-primary-light-9);
  --el-menu-border-color: var(--el-border-color);
  --el-menu-base-level-padding: 20px;
  --el-menu-level-padding: 27px;
  --el-menu-icon-width: 24px;

  .el-menu--collapse {
    --el-menu-base-level-padding: 8px;

    &:deep(.el-menu-tooltip__trigger) {
      width: 30px !important;
      height: 30px !important;
      padding: 0 3px !important;
    }
  }

  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  transition: all 0.3s ease;

  :deep(.el-divider--horizontal) {
    width: calc(100% - 16px);
    margin: 0 8px;
  }

  .logo {
    box-sizing: border-box;
    height: 48px;
    border-bottom: 0 solid #1d1e26;
    box-shadow: 0;
    background-color: var(--el-color-primary);
    cursor: pointer;

    .el-icon {
      font-size: 28px;

      &.title {
        height: 25px;
        width: 105px;
        font-size: 105px;
      }
    }

    span {
      font-size: 22px;
      font-weight: bold;
      color: #dadada;
      white-space: nowrap;
    }

    img {
      width: 120px;
      height: 34px;
      object-fit: contain;
      margin-right: 8px;
    }
  }

  .connection-box{
    box-sizing: border-box;
    background-color: #fff;
    position: relative;

    .connection-divider{
      width: 100%;
      margin: 0;
      position: absolute;
      left: 0;
      bottom: 0;
      height: 1px;
      background-color: #A0A3B8;
    }

    .connection-info{
      margin: 0 0 0 8px;
      font-size: 14px;
      line-height: 21px;
      color: #131926;
      flex: 1;
      justify-content: space-between;

      .connection-name{
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .cluster-list {
      display: flex;
      margin-right: 8px;
      border-radius: 12px;
      background-color: #f0f1fa;
      padding: 1px;

      .cluster-type {
        padding: 3px 5px;
        cursor: pointer;
        border-radius: 12px;
        background-color: transparent;
        font-size: 12px;
        line-height: 12px;
        font-weight: 300;
        color: #656a85;
      }

      .cluster-active {
        background-color: #495ad4;
        color: #fff;
      }
    }

    .connection-host-port{
      font-size: 12px;
      line-height: 18px;
      color: #424561;
      max-width: 142px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .el-scrollbar {
    // height: calc(100% - 100px);

    .el-menu {
      flex: 1;
      overflow: auto;
      overflow-x: hidden;
      border-right: none;

      &::-webkit-scrollbar {
        background-color: #20222a;
      }

      &::-webkit-scrollbar-thumb {
        background-color: #41444b;
      }
    }
  }
}
</style>
