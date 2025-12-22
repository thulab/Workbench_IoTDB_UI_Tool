<template>
  <el-dialog :title="t('aiAnalysis.fineTuning')" v-model="dialogVisible" width="540px" align-center>
    <el-form ref="formRef" :model="formData" :rules="formRules" :label-width="locale === 'en' ? '140px' : '140px'" label-position="right">
      <base-form-item :label="`${t('aiAnalysis.sourceModel')}：`" prop="rawModelId">
        <el-select v-model="formData.rawModelId" id="fine-tuning-raw" v-loading="getModelsLoading" :placeholder="t('aiAnalysis.sourceModelPlaceholder')">
          <el-option v-for="item in modelOptions" :key="item.modelId" :label="item.modelId" :value="item.modelId" />
        </el-select>
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.fineTuningModel')}：`" prop="tunedModelId">
        <template #label>
          {{ t('aiAnalysis.fineTuningModel') }}：
          <el-tooltip effect="light" placement="top" popper-class="table-tooltip-max-width">
            <template v-slot:content>
              <div v-html="t('aiAnalysis.importModelNameHover')"></div>
            </template>
            <i-custom-question
          /></el-tooltip>
        </template>
        <el-input v-model="formData.tunedModelId" id="fine-tuning-name" maxlength="64" :placeholder="t('aiAnalysis.fineTuningModelPlaceholder')" />
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.fineTuningData')}：`" v-if="!connectionStore.isTableModel" prop="name">
        <timeseries-select-single
          id="fine-tuning-path"
          v-model="formData.path"
          :placeholder="t('aiAnalysis.fineTuningDataPlaceholder')"
          :selectWidth="388"
          :itemWidth="200"
          show-suffix
          :disabled-path="disabledPath"
        />
      </base-form-item>
      <template v-else>
        <base-form-item :label="`${t('aiAnalysis.fineTuningData')}：`" prop="database">
          <el-select v-model="formData.database" id="fine-tuning-database" :placeholder="t('aiAnalysis.fineTuningDatabasePlaceholeder')" @change="handleDatabaseSelected" v-loading="getModelsLoading">
            <el-option v-for="item in dbStore.userTreeData" :key="item.nodeName" :label="item.nodeName" :value="item.nodeName" />
          </el-select>
        </base-form-item>
        <base-form-item label="" prop="table" class="hidden-label">
          <template #label></template>
          <el-select
            v-model="formData.table"
            id="fine-tuning-table"
            :placeholder="t('aiAnalysis.fineTuningTablePlaceholder')"
            v-loading="getModelsLoading"
            :disabled="!formData.database"
            @change="
              () => {
                formData.measurement = '';
              }
            "
          >
            <el-option v-for="item in currentDatabase?.children || []" :key="item.nodeName" :label="item.nodeName + (item.comment ? `(${item.comment})` : '')" :value="item.nodeName" />
          </el-select>
        </base-form-item>
        <base-form-item label="" prop="measurement" class="hidden-label">
          <el-select
            v-model="formData.measurement"
            id="fine-tuning-measurement"
            :placeholder="t('aiAnalysis.fineTuningMeasurementPlaceholder')"
            :disabled="!formData.table"
            v-loading="getModelsLoading"
          >
            <el-option
              v-for="item in currentTable?.children?.filter((item) => item.category === 'FIELD') || []"
              :key="item.nodeName"
              :label="item.nodeName + (item.comment ? `(${item.comment})` : '')"
              :value="item.nodeName"
            />
          </el-select>
        </base-form-item>
      </template>
      <base-form-item :label="`${t('aiAnalysis.dataSetTimeRange')}：`" prop="field">
        <el-date-picker
          v-model="formData.timeRange"
          type="datetimerange"
          range-separator="-"
          unlink-panels
          :shortcuts="shortcutsDaterange"
          :clearable="true"
          :prefix-icon="ICustomCalender"
          :start-placeholder="t('search.startTime')"
          :end-placeholder="t('search.endTime')"
          id="data-search-datetimerange"
        />
      </base-form-item>
      <div class="exits-tip" v-if="!paramsVisible">
        <el-button link type="primary" disabled @click="showParam">{{ t('aiAnalysis.moreParam') }}</el-button>
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
import type { FormInstance, FormRules } from 'element-plus';
import MonacoEditor from '@/components/monaco-editor/monaco-editor.vue';
import { useConnectionStore, useDbStore } from '@/stores';
import { AIAnalysisApi } from '@/api';
import { getStartAndEnd } from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';
import type { Model, MeasurementDataItem } from '@/types';

const props = withDefaults(
  defineProps<{
    visible: boolean;
  }>(),
  {},
);

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', reload: boolean): void;
}>();

const inputEditor = ref<InstanceType<typeof MonacoEditor>>();
const connectionStore = useConnectionStore();

const dbStore = useDbStore();

const { requestFn: fineTune, loading: saveLoading } = useRequest(AIAnalysisApi.fineTune);
const { requestFn: getModels, loading: getModelsLoading } = useRequest(AIAnalysisApi.getModels);

const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const paramsVisible = ref(false);

const { shortcutsDaterange } = useShortcutsDate();

const formRef = ref<FormInstance>();
const formData = reactive<{
  rawModelId: string;
  tunedModelId: string;
  path: string;
  field: string;
  params: string;
  database?: string;
  timeRange: [number, number] | [string, string] | [Date, Date] | [];
  table?: string;
  measurement?: string;
}>({
  rawModelId: '',
  tunedModelId: '',
  path: '',
  field: '',
  params: '',
  timeRange: [],
});
const formRules = reactive<FormRules>({
  rawModelId: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'change',
    },
  ],
  tunedModelId: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
    {
      min: 2,
      message: t('common.formRuleLength'),
      trigger: 'blur',
    },
    {
      max: 64,
      message: t('common.formRuleLength'),
      trigger: 'blur',
    },
    {
      pattern: /^[a-zA-Z0-9-_]+$/,
      message: t('aiAnalysis.inputFormatErrorTip'),
      trigger: 'blur',
    },
  ],
  path: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'change',
    },
  ],
  database: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'change',
    },
  ],
  table: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'change',
    },
  ],
  measurement: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'change',
    },
  ],
});

const modelList = ref<Array<Model>>([]);

const currentDatabase = computed(() => {
  return dbStore.treeData.find((item) => item.nodeName === formData.database);
});

const currentTable = computed(() => {
  return currentDatabase.value?.children?.find((item) => item.nodeName === formData.table);
});

const modelOptions = computed(() => {
  return modelList.value.filter((item) => ['Timer-Sundial', 'Timer-XL']!.includes(item.modelType));
});
const allowedTypes = computed(() => {
  const result: string[] = ['INT32', 'INT64', 'FLOAT', 'DOUBLE'];
  return result;
});

function disabledPath(item: MeasurementDataItem) {
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
        path: connectionStore.isTableModel ? `"${formData.database}"."${formData.table}"` : formData.path,
        field: connectionStore.isTableModel ? `"${formData.measurement}"` : formData.field,
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

function handleDatabaseSelected() {
  formData.table = '';
  formData.measurement = '';
}

onMounted(() => {
  getModels('').then((res) => {
    modelList.value = res.data.filter((item) => item.state === 'ACTIVE') || [];
  });
  dbStore.getDatabases();
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
      formData.timeRange = getStartAndEnd();
    }
  },
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
