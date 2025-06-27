<template>
  <div class="sql-statement">
    <el-scrollbar ref="scrollbarRef">
      <div ref="innerRef">{{ sqls }}</div>
    </el-scrollbar>
    <el-icon size="24" @click="copySql" class="svg-button-hover-color copy-icon"><i-custom-copy /></el-icon>
  </div>
</template>

<script setup lang="ts">
import { type ScrollbarInstance } from 'element-plus';
import { useClipboard } from '@vueuse/core';

const { t } = useI18n();
const props = defineProps<{
  sql?: string;
}>();

const sqls = ref(props.sql || '');
const innerRef = ref<HTMLDivElement>();
const scrollbarRef = ref<ScrollbarInstance>();

const { copy } = useClipboard({ source: sqls });

const appendSql = (sql: string, prefix?: string) => {
  if (sqls.value && !sqls.value.endsWith('\n')) {
    sqls.value += '\n';
  }
  if (prefix) sqls.value += `${prefix} `;
  sqls.value += sql;
  scrollbarRef.value?.scrollTo({ top: innerRef.value?.clientHeight || 0, behavior: 'smooth' });
};

const copySql = () => {
  copy(sqls.value)
    .then(() => {
      ElMessage.success({ message: t('flow.copySuccess'), grouping: true });
    })
    .catch(() => {
      ElMessage.error({ message: t('flow.copyFailed'), grouping: true });
    });
};

defineExpose({
  appendSql,
});
</script>

<style lang="scss" scoped>
.sql-statement {
  padding: 4px 0 4px 16px;
  font-size: 12px;
  border: 1px solid #dfe1ed;
  border-radius: 6px;
  height: 100px;
  margin: 0 16px;
  position: relative;
  white-space: pre;
  line-height: 1.5;

  .copy-icon {
    position: absolute;
    right: 8px;
    bottom: 8px;
    cursor: pointer;
  }
}
</style>
