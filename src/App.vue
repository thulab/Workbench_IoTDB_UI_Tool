<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import zhLocale from 'element-plus/es/locale/lang/zh-cn';
import enLocale from 'element-plus/es/locale/lang/en';
// import deLocale from 'element-plus/es/locale/lang/de';
import { useI18n } from 'vue-i18n';
import useAppStore from '@/stores/app';
import { useEnumStore, useUserStore } from '@/stores';
import { useLangSwitched } from '@/composition-api';

const appStore = useAppStore();
const userStore = useUserStore();
zhLocale.el.pagination.goto = '跳至';
zhLocale.el.select.noData = '暂无数据';
zhLocale.el.select.noMatch = '暂无数据';

const map = {
  [zhLocale.name]: zhLocale,
  [enLocale.name]: enLocale,
  // [deLocale.name]: deLocale,
};

const enumStore = useEnumStore();
const { locale } = useI18n();
const language = ref(map[locale.value]);

useLangSwitched(() => {
  language.value = map[locale.value];
  nextTick(() => {
    enumStore.loadAllEnum();
    userStore.loadPrivilegesEnum(true);
  });
});
</script>

<template>
  <el-config-provider :locale="language" :size="appStore.elementSize" :button="{ autoInsertSpace: true }">
    <router-view />
  </el-config-provider>
</template>
