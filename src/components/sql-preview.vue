<template>
  <div class="sql-statement">
    <monaco-editor ref="innerRef" :read-only="true" language="sql" />
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

const { copy, isSupported } = useClipboard({ source: sqls });

const appendSql = (sql: string, prefix?: string) => {
  if (sqls.value && !sqls.value.endsWith('\n')) {
    sqls.value += '\n';
  }
  if (prefix) sqls.value += `${prefix} `;
  sqls.value += sql;
  innerRef.value?.setContent(sqls.value);
  innerRef.value?.setScrollToButtom();
};

const copyText = async (text: string) => {
  // 检查浏览器是否支持 Clipboard API
  if (isSupported && window.location.protocol === 'https:') {
    try {
      await copy(text);
      ElMessage.success(t('flow.copySuccess'));
    } catch (err) {
      console.error('复制失败 (Clipboard API):', err);
      // 降级方案
      fallbackCopy(text);
    }
  } else {
    // 浏览器不支持 Clipboard API，使用降级方案
    fallbackCopy(text);
  }
};

const fallbackCopy = (text: string) => {
  // 创建临时 input 元素
  const input = document.createElement('input');
  input.setAttribute('value', text);
  input.setAttribute('readonly', '');
  input.style.position = 'absolute';
  input.style.left = '-9999px';
  document.body.appendChild(input);

  // 选择并复制
  input.select();
  input.setSelectionRange(0, 99999); // 对于移动设备可选

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      ElMessage.success(t('flow.copySuccess'));
    } else {
      throw new Error('复制命令执行失败');
    }
  } catch (err) {
    console.error('复制失败 (降级方案):', err);
    ElMessage.error(t('flow.copyFailed'));
  } finally {
    // 清理
    document.body.removeChild(input);
  }
};

const copySql = () => {
  copyText(sqls.value);
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
