<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/lib/locale/lang/zh-cn';
import en from 'element-plus/lib/locale/lang/en';
import de from 'element-plus/lib/locale/lang/de';
import useAppStore from '@/stores/app';
import { useI18n } from 'vue-i18n';
import { LOCALE } from './constants';

const appStore = useAppStore();
const { locale: language } = useI18n();
zhCn.el.pagination.goto = '跳至';
const locale = computed(() => {
  switch (language.value) {
    case LOCALE.ZH_CN:
      return zhCn;
    case LOCALE.EN:
      return en;
    case LOCALE.DE:
      return de;
    default:
      return zhCn;
  }
});

</script>

<template>
  <el-config-provider
    :locale="locale"
    :size="appStore.elementSize"
    :button="{ autoInsertSpace: true }">
    <router-view />
  </el-config-provider>
</template>
