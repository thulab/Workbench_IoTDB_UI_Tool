<template>
  <el-dialog
    :title="t('spectrum.sqlInput')"
    v-model="dialogVisible"
    width="748px"
    align-center
    :close-on-click-modal="false"
    :before-close="beforeClose"
    id="sql-modal"
    class="sql-dialog"
  >
    <div class="code-box">
      <code-editor
        v-show="codeMirrorReady"
        v-model:model-value="sqlInput"
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
        <el-button type="primary" @click="handleConfirm" id="sql-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import CodeEditor from '@/views/search/components/code-editor.vue';

const props = defineProps<{
  visible: boolean;
  sqlValue: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleConfirm', val: string): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const sqlInput = ref('');
const codeMirrorReady = ref(false);
const codeEditorRef = ref<InstanceType<typeof CodeEditor>>();

const beforeClose = () => {
  dialogVisible.value = false;
};

const handleEmpty = () => {
  sqlInput.value = '';
};

const handleConfirm = () => {
  dialogVisible.value = false;
  emit('handleConfirm', sqlInput.value);
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      sqlInput.value = props.sqlValue;
    }
  },
);
</script>
