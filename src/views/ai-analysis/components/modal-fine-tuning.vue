<template>
  <el-dialog :title="t('aiAnalysis.fineTuning')" v-model="dialogVisible" width="540px" align-center>
    <el-form ref="formRef" :model="formData" :rules="formRules" :label-width="locale === 'en' ? '120px' : '120px'" label-position="right">
      <base-form-item :label="`${t('aiAnalysis.sourceModel')}：`" :placeholder="t('aiAnalysis.sourceModelPlaceholder')" prop="rawModelId">
        <el-select v-model="formData.rawModelId" id="fine-tuning-raw" v-loading="getModelsLoading">
          <el-option v-for="item in modelOptions" :key="item.modelId" :label="item.modelId" :value="item.modelId" />
        </el-select>
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.fineTuningModel')}：`" :placeholder="t('aiAnalysis.fineTuningModelPlaceholder')" prop="tunedModelId">
        <el-input v-model="formData.tunedModelId" id="fine-tuning-name" />
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.fineTuningData')}：`" prop="name">
        <timeseries-select-single id="fine-tuning-path" v-model="formData.path" :selectWidth="230" :itemWidth="200" show-suffix :disabled-path="disabledPath" />
      </base-form-item>
      <div class="exits-tip" v-if="!paramsVisible">
        <el-button link type="primary" @click="showParam">{{ t('aiAnalysis.moreParam') }}</el-button>
      </div>
      <base-form-item :label="`${t('aiAnalysis.superParam')}：`" prop="field" v-if="paramsVisible">
        <monaco-editor class="input-container" ref="inputEditor" @mounted="initContent" />
      </base-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" :id="`write-back-modal-cancel`">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" :id="`write-back-modal-confirm`">
          {{ t('common.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import MonacoEditor from '@/components/monaco-editor/monaco-editor.vue';

import { AIAnalysisApi } from '@/api';

const props = withDefaults(
  defineProps<{
    visible: boolean;
  }>(),
  {}
);

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', reload: boolean): void;
}>();

const inputEditor = ref<InstanceType<typeof MonacoEditor>>();

const { requestFn: fineTune, loading: saveLoading } = useRequest(AIAnalysisApi.fineTune);
const { requestFn: getModels, loading: getModelsLoading } = useRequest(AIAnalysisApi.getModels);

const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const paramsVisible = ref(false);

const formRef = ref<FormInstance>();
const formData = reactive<{
  rawModelId: string;
  tunedModelId: string;
  path: string;
  field: string;
  params: string;
}>({
  rawModelId: '',
  tunedModelId: '',
  path: '',
  field: '',
  params: '',
});
const formRules = reactive({
  rawModelId: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
  ],
  tunedModelId: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
  ],
  path: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
  ],
});

const modelList = ref<Array<AIAnalysis.Model>>([]);

const modelOptions = computed(() => {
  return modelList.value.filter((item) => ['Timer-Sundial', 'Timer-XL'].includes(item.modelType));
});
const allowedTypes = computed(() => {
  const result: string[] = ['INT32', 'INT64', 'FLOAT', 'DOUBLE'];
  return result;
});

function disabledPath(item: StorageDevice.MeasurementDataItem) {
  return allowedTypes.value.indexOf(item.dataType) === -1;
}

function handleCancel() {
  dialogVisible.value = false;
}

function handleConfirm() {
  formRef.value?.validate((valid) => {
    if (valid) {
      fineTune({
        rawModelId: formData.rawModelId,
        tunedModelId: formData.tunedModelId,
        path: formData.path,
        field: formData.field,
        params: inputEditor.value?.getContent()?.split('\n') || undefined,
      }).then(() => {
        ElMessage.success(t('aiAnalysis.fineTuningSuccess'));
        emit('handleSave', true);
      });
    }
  });
}
function showParam() {
  paramsVisible.value = !paramsVisible.value;
}

function initContent() {
  inputEditor.value?.setContent(formData.params);
}

onMounted(() => {
  getModels('').then((res) => {
    modelList.value = res.data.filter((item) => item.state === 'ACTIVE') || [];
  });
});

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formData.rawModelId = '';
      formData.tunedModelId = '';
      formData.path = '';
      formData.field = '';
      formData.params = '';
      formRef.value?.resetFields();
    }
  }
);
</script>

<style lang="scss" scoped>
.type-input-disabled {
  :deep(.el-input__inner) {
    color: #131926;
    -webkit-text-fill-color: #131926;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none;
  }
}

.exits-tip {
  padding: 0;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

.input-container {
  flex: 1;
  height: 120px;
  overflow: auto;
  box-sizing: border-box;
}
</style>
