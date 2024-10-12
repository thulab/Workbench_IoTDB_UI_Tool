<template>
  <el-dialog :title="t('aiAnalysis.configYaml')" v-model="dialogVisible" width="748px" class="new-storage-container" align-center :close-on-click-modal="false" id="ai-analysis-model-config">
    <div>
      <monaco-editor class="output-container" ref="outputEditor" :read-only="true" @mounted="initContent" />
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import MonacoEditor from '@/components/monaco-editor/monaco-editor.vue';

const props = defineProps<{
  visible: boolean;
}>();
const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (e: 'handle-close', reload: boolean): void;
}>();
const dialogVisible = useVModel(props, 'visible', emit);
const outputEditor = ref<InstanceType<typeof MonacoEditor>>();
const content = ref<string>('');

const { t } = useI18n();

function configContent(c: string) {
  let output = 'config:\n';
  c.split(']').forEach((line) => {
    if (line) {
      output += `  ${line}]\n`;
    }
  });
  content.value = output;

  outputEditor.value?.setContent(output);
}

function initContent() {
  outputEditor.value?.setContent(content.value);
}

defineExpose({
  configContent,
});
</script>

<style lang="scss" scoped>
.output-container {
  flex: 1;
  overflow: auto;
  box-sizing: border-box;
  min-height: 500px;
}
</style>
