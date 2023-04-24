<template>
  <div class="header">
    <div class="header-lf flex-center">
      <el-icon
        class="collapse-icon"
        @click="menuStore.setCollapse()">
        <i-ep-expand v-if="isCollapse" />
        <i-ep-fold v-else />
      </el-icon>
      <el-breadcrumb :separator-icon="IconEpArrowRight">
        <transition-group
          name="breadcrumb"
          mode="out-in">
          <el-breadcrumb-item
            :key="HOME_URL"
            :to="{ path: HOME_URL }">
            Home
          </el-breadcrumb-item>
          <el-breadcrumb-item
            v-for="item in matched"
            :key="item.path">
            {{ item.meta.title }}
          </el-breadcrumb-item>
        </transition-group>
      </el-breadcrumb>
    </div>
    <div class="header-ri flex-center">

      <el-dropdown @command="handleLangCommand">
        <span class="lang-icon m-r-20">
          <i-custom-lang-switch />
        </span>
        <template #dropdown>
          <el-dropdown-menu class="operate-dropdown">
            <el-dropdown-item
              v-for="item in localeList"
              :disabled="locale === item.locale"
              :key="item.locale"
              :command="item.locale">{{item.label}}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-switch
        v-model="isDark"
        class="switch-dark"
        inline-prompt
        :active-icon="IconEpMoon"
        :inactive-icon="IconEpSunny" />

      <user-header />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { HOME_URL } from '@/config/app-config';
import useMenuStore from '@/stores/menu';
import { localeList } from '@/constants';
import { useI18n } from 'vue-i18n';
import UserHeader from './components/layout-header-user.vue';
import IconEpArrowRight from '~icons/ep/arrow-right.svg';
import IconEpMoon from '~icons/ep/moon.svg';
import IconEpSunny from '~icons/ep/sunny.svg';

const route = useRoute();
const { locale } = useI18n();

const matched = computed(() => route.matched.filter((item) => item.meta && item.meta.title && item.meta.title !== 'Home'));
const menuStore = useMenuStore();
const isCollapse = computed((): boolean => menuStore.isCollapse);
const isDark = useDark();
const handleLangCommand = (command: string) => {
  locale.value = command;
  window.localStorage.setItem('locale', command);
};
</script>

<style scoped lang="scss">
.header {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 55px;
  padding: 0 15px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-extra-light);

  .header-lf {
    .collapse-icon {
      margin-right: 20px;
      font-size: 22px;
      cursor: pointer;
    }
  }

  .header-ri {
    margin: 0 30px;

    .lang-icon {
      background-color: var(--el-color-primary);
      border-radius: 6px;
      color: #fff;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .switch-dark {
      margin: 0 22px 0 0;
    }
  }
}
</style>
