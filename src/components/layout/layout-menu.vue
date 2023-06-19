<template>
  <div
    class="menu"
    :style="{ width: isCollapse ? '40px' : '216px' }">
    <div class="logo flex-align-center" :style="{ paddingLeft: isCollapse ? '6px' : '14px' }">
      <el-icon alt="logo"><i-custom-logo /></el-icon>
      <el-icon class="title" v-show="!isCollapse"><i-custom-title /></el-icon>
      <!-- <span v-show="!isCollapse">{{ systemTitle }}</span> -->
    </div>
    <el-scrollbar>
      <el-menu
        :default-active="activeMenu"
        :router="true"
        :collapse="isCollapse"
        :collapse-transition="false"
        :unique-opened="false">
        <layout-menu-sub-item :menu-list="menuList" />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { type RouteRecordRaw, useRoute, useRouter } from 'vue-router';
// import { storeToRefs } from 'pinia';
import useMenuStore from '@/stores/menu';
// import useAppStore from '@/stores/app';
import LayoutMenuSubItem from './components/layout-menu-sub-item.vue';

// const appStore = useAppStore();

// const { systemTitle } = storeToRefs(appStore);

const route = useRoute();
const menuStore = useMenuStore();
const router = useRouter();
const allRoutes = computed(() => router.options.routes);

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

const getMenuList = () => {
  const menuList = [] as Array<MenuOptions>;
  const routesHasTitle = allRoutes.value.filter((item) => item?.meta?.title && !item.meta?.hiddenMenu);
  routesHasTitle.forEach((item) => {
    menuList.push(routesToMenu(item, ''));
  });

  return menuList;
};

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

    .el-icon {
      font-size: 28px;

      &.title {
        margin-left: 16px;
        height: 20px;
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

  .el-scrollbar {
    height: calc(100% - 55px);

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
