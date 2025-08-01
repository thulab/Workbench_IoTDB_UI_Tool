<script setup lang="ts">
import zhLocale from 'element-plus/es/locale/lang/zh-cn';
import enLocale from 'element-plus/es/locale/lang/en';
// import deLocale from 'element-plus/es/locale/lang/de';
import { useI18n } from 'vue-i18n';
import useAppStore from '@/stores/app';
import { useLangSwitched } from '@/composition-api';

const appStore = useAppStore();
zhLocale.el.pagination.goto = '跳至';
zhLocale.el.select.noData = '暂无数据';
zhLocale.el.select.noMatch = '暂无数据';
enLocale.el.pagination.pagesize = ' results/page';
enLocale.el.pagination.goto = 'Go to page';

const map = {
  [zhLocale.name]: zhLocale,
  [enLocale.name]: enLocale,
  // [deLocale.name]: deLocale,
};

const { locale } = useI18n();
const language = ref(map[locale.value]);
document.documentElement.lang = locale.value;

useLangSwitched(() => {
  document.documentElement.lang = locale.value;
  language.value = map[locale.value];
});
</script>

<template>
  <el-config-provider :locale="language" :size="appStore.elementSize" :button="{ autoInsertSpace: true }">
    <router-view />
  </el-config-provider>
</template>
