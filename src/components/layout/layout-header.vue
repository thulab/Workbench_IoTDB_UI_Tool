<template>
  <div class="header">
    <div class="header-lf flex-center">
      <el-icon class="collapse-icon" id="layout-header-collapse" @click="menuStore.setCollapse()">
        <i-custom-nav-open v-if="isCollapse" />
        <i-custom-nav-close v-else />
      </el-icon>
      <!-- eslint-disable-next-line vue/no-constant-condition -->
      <el-breadcrumb :separator-icon="IconEpArrowRight" v-if="false">
        <transition-group name="breadcrumb" mode="out-in">
          <el-breadcrumb-item :key="HOME_URL" :to="{ path: HOME_URL }">Home</el-breadcrumb-item>
          <el-breadcrumb-item v-for="item in matched" :key="item.path">
            {{ item.meta.title }}
          </el-breadcrumb-item>
        </transition-group>
      </el-breadcrumb>
    </div>
    <div class="header-ri flex-center">
      <!-- eslint-disable-next-line vue/no-constant-condition -->
      <el-dropdown @command="handleChangeLang" v-show="false">
        <span class="lang-icon m-r-20">
          <i-custom-language />
        </span>
        <template #dropdown>
          <el-dropdown-menu class="operate-dropdown">
            <el-dropdown-item :disabled="langIndex === 0" command="0">中文</el-dropdown-item>
            <el-dropdown-item :disabled="langIndex === 1" command="1">English</el-dropdown-item>
            <!-- <el-dropdown-item :disabled="langIndex === 2" command="2">Deutsch</el-dropdown-item> -->
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- eslint-disable-next-line vue/no-constant-condition -->
      <el-switch v-if="false" v-model="isDark" class="switch-dark" inline-prompt :active-icon="IconEpMoon" :inactive-icon="IconEpSunny" />

      <user-header />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { HOME_URL } from '@/config/app-config';
import useMenuStore from '@/stores/menu';
import { useI18n } from 'vue-i18n';
import { useLangSwitch } from '@/composition-api';
import { useEnumStore, useUserStore } from '@/stores';
import UserHeader from './components/layout-header-user.vue';
import IconEpArrowRight from '~icons/ep/arrow-right.svg';
import IconEpMoon from '~icons/ep/moon.svg';
import IconEpSunny from '~icons/ep/sunny.svg';

const route = useRoute();
const userStore = useUserStore();
const enumStore = useEnumStore();
const { langIndex, handleLangCommand } = useLangSwitch(useI18n());
const matched = computed(() => route.matched.filter((item) => item.meta && item.meta.title && item.meta.title !== 'Home'));
const menuStore = useMenuStore();
const isCollapse = computed((): boolean => menuStore.isCollapse);
const isDark = useDark();

function handleChangeLang(val: '0' | '1') {
  handleLangCommand(val);
  nextTick(() => {
    const { locale: useI18nLocale } = useI18n();
    document.documentElement.lang = useI18nLocale.value;
    enumStore.loadAllEnum();
    userStore.loadPrivilegesEnum(true);
  });
}
</script>

<style scoped lang="scss">
.header {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
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

      &:focus-visible {
        outline: none;
      }
    }

    .switch-dark {
      margin: 0 22px 0 0;
    }
  }
}
</style>
