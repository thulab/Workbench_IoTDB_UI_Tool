<template>
  <el-dialog
    :title="t('spectrum.sqlInput')"
    v-model="dialogVisible"
    width="748px"
    align-center
    :close-on-click-modal="false"
    id="sql-modal"
    class="sql-dialog"
  >
    <div class="code-box">
      <code-editor
        v-show="codeMirrorReady"
        v-model:model-value="expression"
        @ready="() => codeMirrorReady = true"
        :style="{
          height: `410px`,
          backgroundColor: '#F7F8FC',
        }"
        ref="codeEditorRef"
      />
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleEmpty" id="sql-modal-cancel">{{ t('common.clear') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" id="sql-modal-confirm">{{ t('common.save') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import CodeEditor from '@/views/search/components/code-editor.vue';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const codeMirrorReady = ref(false);
const codeEditorRef = ref<InstanceType<typeof CodeEditor>>();
const saveLoading = ref(false);
const expression = ref('');

const handleEmpty = () => {
  expression.value = '';
  dialogVisible.value = false;
};

const handleConfirm = () => {
  dialogVisible.value = false;
};
</script>

<style lang="scss">
.sql-dialog{
  border-radius: 4px !important;
}
</style>
