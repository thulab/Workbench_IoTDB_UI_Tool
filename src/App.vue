<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import useAppStore from '@/stores/app';

const appStore = useAppStore();
zhCn.el.pagination.goto = '跳至';
zhCn.el.select.noData = '暂无数据';
zhCn.el.select.noMatch = '暂无数据';
const locale = computed(() => zhCn);

</script>

<template>
  <el-config-provider
    :locale="locale"
    :size="appStore.elementSize"
    :button="{ autoInsertSpace: true }">
    <router-view />
  </el-config-provider>
</template>
