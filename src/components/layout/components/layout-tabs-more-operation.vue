<template>
  <div class="more-operation">
    <el-dropdown trigger="click">
      <el-button
        size="small"
        type="primary">
        <span>{{ $t('common.more') }}</span>
        <el-icon class="el-icon--right">
          <i-ep-arrow-down />
        </el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            :icon="IconEpCircleClose"
            :disabled="currentDisabled"
            @click="closeCurrentTab">
            {{ $t('common.closeCurrent') }}
          </el-dropdown-item>
          <el-dropdown-item
            :icon="IconEpClose"
            :disabled="tabsMenuList.length < 3"
            @click="closeOtherTab">
            {{ $t('common.closeOther') }}
          </el-dropdown-item>
          <el-dropdown-item
            :icon="IconEpCloseBold"
            :disabled="tabsMenuList.length <= 1"
            @click="closeAllTab">
            {{ $t('common.closeAll') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-button
      size="small"
      text
      @click="switchFullscreen">
      <el-icon><i-ep-full-screen /></el-icon>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import useAppStore from '@/stores/app';
import useTabsStore from '@/stores/tabs';
import { HOME_URL } from '@/config/app-config';
import { storeToRefs } from 'pinia';
import IconEpCircleClose from '~icons/ep/circle-close.svg';
import IconEpClose from '~icons/ep/close.svg';
import IconEpCloseBold from '~icons/ep/close-bold.svg';

const appStore = useAppStore();
const tabStore = useTabsStore();

const { tabsMenuList } = storeToRefs(tabStore);

const currentDisabled = computed(() => tabStore.tabsMenuValue === HOME_URL);

// Close Current
const closeCurrentTab = () => {
  if (tabStore.tabsMenuValue === HOME_URL) return;
  tabStore.removeTabs(tabStore.tabsMenuValue);
};

// Close Other
const closeOtherTab = () => {
  tabStore.closeMultipleTab(tabStore.tabsMenuValue);
};

// Close All
const closeAllTab = () => {
  tabStore.closeMultipleTab();
  tabStore.goHome();
};

// 全屏
function switchFullscreen() {
  appStore.contentFullScreen = !appStore.contentFullScreen;
}
</script>
