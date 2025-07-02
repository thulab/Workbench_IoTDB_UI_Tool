<template>
  <div class="sql-statement">
    <monaco-editor ref="innerRef" :read-only="true" />
    <el-icon size="24" @click="copySql" class="svg-button-hover-color copy-icon"><i-custom-copy /></el-icon>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import MonacoEditor from '@/components/monaco-editor/monaco-editor.vue';

const { t } = useI18n();
const props = defineProps<{
  sql?: string;
}>();

const sqls = ref(props.sql || '');
const innerRef = ref<InstanceType<typeof MonacoEditor>>();

const { copy } = useClipboard({ source: sqls });

const appendSql = (sql: string, prefix?: string) => {
  if (sqls.value && !sqls.value.endsWith('\n')) {
    sqls.value += '\n';
  }
  if (prefix) sqls.value += `${prefix} `;
  sqls.value += sql;
  innerRef.value?.setContent(sqls.value);
  innerRef.value?.setScrollToButtom();
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
  border-radius: 2px;
  height: 100px;
  margin: 16px 0 0 !important;
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
