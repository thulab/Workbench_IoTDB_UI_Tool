<template>
  <template v-for="subItem in menus" :key="subItem.path">
    <template v-if="subItem.children && subItem.children.length > 0">
      <el-divider v-if="!subItem.hideLine" />
      <el-sub-menu :index="subItem.path">
        <template #title>
          <el-icon v-if="subItem.icon">
            <!--  eslint-disable-next-line vue/eqeqeq -->
            <i v-if="isCollapse && subItem.activeIcon && rootMenu?.activeIndex?.indexOf(subItem.path) == 0" v-html="subItem.activeIcon"></i>
            <i v-else v-html="subItem.icon"></i>
          </el-icon>
          <span :id="subItem.path" :style="{ 'font-size': '12px' }">{{ subItem.title }}</span>
        </template>
        <layout-menu-sub-item :menu-list="subItem.children" :show-auth-menu="showAuthMenu" />
      </el-sub-menu>
    </template>
    <template v-else>
      <el-divider v-if="subItem.showTopLine" />
      <el-menu-item :id="subItem.path" :index="subItem.path" :style="{ 'font-size': '12px' }">
        <el-icon v-if="subItem.icon">
          <i v-if="isCollapse && subItem.activeIcon && subItem.path === rootMenu?.activeIndex" v-html="subItem.activeIcon"></i>
          <i v-else v-html="subItem.icon"></i>
        </el-icon>
        <template v-if="!subItem.isLink" #title>
          <span>{{ subItem.title }}</span>
        </template>
        <template v-else #title>
          <a class="href" :href="subItem.isLink" rel="noopener noreferrer" target="_blank">{{ subItem.title }}</a>
        </template>
      </el-menu-item>
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type MenuProvider } from 'element-plus';
import useMenuStore from '@/stores/menu';
import { useConnectionStore, useUserStore } from '@/stores';
import { iotdbShowAuth } from '@/utils/auth';

const menuStore = useMenuStore();
const userStore = useUserStore();
const connectionStore = useConnectionStore();
const isCollapse = computed((): boolean => menuStore.isCollapse);
const rootMenu = inject<MenuProvider>('rootMenu');

const props = defineProps<{
  menuList: globalThis.MenuOptions[];
  showAuthMenu?: boolean;
}>();

const showVersionMenu = (version: string) => iotdbShowAuth(connectionStore.connectionInfo.currentVersion, version);

const menus = computed<globalThis.MenuOptions[]>(() => {
  const { menuList } = props;
  menuList.sort((a, b) => (a.order || 0) - (b.order || 0));
  return menuList
    .filter((item) => {
      // 未登录
      if (!userStore.userInfo.name) return false;
      if (connectionStore.isTableModel) {
        return item.sqlDialect === 'all' || item.sqlDialect === 'table';
      }
      return !item.sqlDialect || item.sqlDialect === 'all' || item.sqlDialect !== 'table';
    })
    .filter((item) => {
      if (item.isAuthMenu) {
        return props.showAuthMenu;
      }
      if (item.needVersion) {
        return showVersionMenu(item.needVersion);
      }
      return true;
    });
});
</script>

<style scoped lang="scss">
.el-sub-menu {
  .el-icon {
    font-size: 30px;
  }
}

.el-menu-item {
  height: 30px !important;
  line-height: 30px !important;

  .el-icon {
    font-size: 30px;
  }

  &.is-active {
    background-color: #f0f1fa !important;
  }

  &.is-active::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    content: '';
    border-radius: 0 4px 4px 0;
    background: var(--el-color-primary);
  }

  // &:hover {
  //   background-color: #f7f8fc !important;
  //   color: #131926;
  // }
}

.active {
  display: none;
}

.el-menu--collapse {
  .el-menu-item {
    padding: 0;
    height: 30px;
    margin: 0 5px;
    border-radius: 4px;

    &.is-active {
      background-color: var(--el-color-primary) !important;

      .active {
        display: block;
      }

      .normal {
        display: none;
      }

      &::before {
        display: none;
      }
    }
  }

  .el-sub-menu {
    &.is-active {
      padding: 5px;

      .active {
        display: block;
      }

      .normal {
        display: none;
      }

      :deep(.el-sub-menu__title) {
        width: 30px;
        height: 30px;
        padding: 0;
        background: var(--el-color-primary);
        border-radius: 4px;

        .el-icon {
          margin: 0 auto;
        }
      }
    }
  }
}

.el-menu--popup {
  .el-menu-item {
    background-color: #fff;

    i {
      margin-right: 5px;
    }

    i,
    span {
      color: #131926;
    }

    &:hover {
      i,
      span {
        color: #131926 !important;
      }
    }

    &.is-active {
      background-color: #f0f1fa !important;

      &::before {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 4px;
        content: '';
        background: var(--el-color-primary);
      }

      i,
      span {
        color: #131926 !important;
      }
    }
  }
}

.href {
  display: inline-block;
  width: 100%;
  height: 100%;
  color: #bdbdc0;
  text-decoration: none;
}
</style>
