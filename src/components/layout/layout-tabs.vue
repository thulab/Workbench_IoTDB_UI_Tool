<template>
  <div class="tabs-box">
    <div class="tabs-menu">
      <el-tabs v-model="tabsMenuValue" type="card" @tab-click="tabClick" @tab-remove="removeTab">
        <el-tab-pane v-for="item in tabsMenuList" :key="item.path" :path="item.path" :label="item.title" :name="item.path" :closable="item.close">
          <template #label>
            <el-icon v-if="item.icon" class="tabs-icon">
              <component :is="item.icon" />
            </el-icon>
            {{ item.title }}
          </template>
        </el-tab-pane>
      </el-tabs>
      <layout-tabs-more-operation />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { TabsPaneContext } from 'element-plus';
import useTabsStore from '@/stores/tabs';
import LayoutTabsMoreOperation from './components/layout-tabs-more-operation.vue';

const tabStore = useTabsStore();
const tabsMenuList = computed(() => tabStore.tabsMenuList);
const tabsMenuValue = computed({
  get: () => tabStore.tabsMenuValue,
  set: (val) => {
    tabStore.setTabsMenuValue(val);
  },
});

const route = useRoute();
const router = useRouter();
// 监听路由的变化（防止后退前进不变化 tabsMenuValue）
watch(
  () => route.fullPath,
  () => {
    const params = {
      title: route.meta.title as string,
      path: route.fullPath,
      close: true,
    };
    tabStore.addTabs(params, false);
  },
  {
    immediate: true,
  },
);

// Tab Click
const tabClick = (tabItem: TabsPaneContext) => {
  const path = tabItem.props.name as string;
  router.push(path);
};

// Remove Tab
const removeTab = (activeTabPath: string | number | undefined) => {
  tabStore.removeTabs(activeTabPath as string);
};
</script>

<style scoped lang="scss">
.tabs-box {
  :deep(.tabs-menu) {
    position: relative;
    width: 100%;

    .more-operation {
      position: absolute;
      top: 8px;
      right: 13px;
    }

    .tabs-icon {
      top: 2px;
    }

    .el-tabs__nav-wrap {
      position: absolute;
      width: calc(100% - 120px);
    }

    .el-tabs--card > .el-tabs__header {
      box-sizing: border-box;
      height: 40px;
      padding: 0 10px;
      margin: 0;
    }

    .el-tabs--card > .el-tabs__header .el-tabs__nav {
      border: none;
    }

    .el-tabs--card > .el-tabs__header .el-tabs__item {
      color: var(--el-text-color-primary);
      border: none;

      .is-icon-close svg {
        margin-top: 0;
      }
    }

    .el-tabs--card > .el-tabs__header .el-tabs__item.is-active {
      color: var(--el-color-primary);
      border-bottom: 2px solid var(--el-color-primary);
    }
  }
}
</style>
