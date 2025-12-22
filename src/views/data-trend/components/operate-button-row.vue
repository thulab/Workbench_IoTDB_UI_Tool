<template>
  <div class="flex items-center mt-6px mb-2px">
    <div v-if="!props.isRunning">
      <div class="text-14px">
        时间范围：
        <el-date-picker
          v-model="selectedDateTime.value"
          type="datetimerange"
          range-separator="-"
          unlink-panels
          :disabled-date="disabledDate"
          :shortcuts="shortcutsDaterange"
          :clearable="false"
          :prefix-icon="ICustomCalender"
          :default-time="[new Date(2024, 3, 28, 0, 0, 0), new Date(2024, 3, 28, 23, 59, 59)]"
          @change="handleChangeTime"
        />
      </div>
    </div>
    <div class="flex items-center">
      <button
        @click="handleRunningPlay"
        v-if="props.isRunning && !runningTrendStore.isPlaying"
        class="w-24px h-24px p-0! flex items-center justify-center bg-[#495AD4] border-0 rounded-4px"
        :disabled="!props.canOperate"
        :style="!props.canOperate ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'"
      >
        <i-custom-play-transparent />
      </button>
      <button
        @click="handleRunningPause"
        v-if="props.isRunning && runningTrendStore.isPlaying"
        class="w-24px h-24px p-0! flex items-center justify-center bg-[#495AD4] border-0 rounded-4px"
        :disabled="!props.canOperate"
        :style="!props.canOperate ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'"
      >
        <i-custom-pause-transparent />
      </button>
      <button
        @click="handleSaveTemplate"
        class="save-button h-24px w-24px box-border p-0! bg-white cursor-pointer rounded-[4px] flex justify-center items-center ml-16px"
        :disabled="!props.canOperate"
        :style="!props.canOperate ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'"
      >
        <i-custom-save-template />
      </button>
      <el-select
        v-model="selectedTemplateId"
        :placeholder="t('dataTrend.selectCommonTrend')"
        class="template-select"
        popper-class="template-select-dropdown"
        clearable
        @change="handleTemplateChange"
        @clear="handleTemplateReset"
      >
        <el-option v-for="item in props.templateList" :key="item.id" :label="item.name" :value="item.id" :id="`trend-template-${item.id}`">
          <div class="template-option-content">
            <div class="template-option-text">
              <i-custom-template />
              <span class="template-name">{{ item.name }}</span>
            </div>
            <div class="template-option-actions">
              <div class="item-edit-box" :id="`trend-template-rename-${item.id}`" @click.stop="handleSqlCommand('rename', item)">
                <i-custom-edit class="item-edit" />
                <i-custom-edit class="item-edit-active" />
              </div>
              <div class="item-delete-box" :id="`trend-template-delete-${item.id}`" @click.stop="handleSqlCommand('delete', item)">
                <i-custom-delete class="item-delete" />
                <i-custom-delete-active class="item-delete-active" />
              </div>
            </div>
          </div>
        </el-option>
      </el-select>
    </div>
    <modal-template v-model:visible="templateVisible" :name-list="nameList" :save-loading="saveTemplateLoading" @handleSave="handleSaveSuccess" />
    <modal-template-rename v-model:visible="renameVisible" :old-name="renameData.name" :name-list="nameList" :save-loading="saveTemplateLoading" @handleSave="handleRenameSuccess" />
  </div>
</template>

<script lang="ts" setup>
import { SearchApi } from '@/api';
import ModalTemplate from './modal-template.vue';
import ModalTemplateRename from './modal-template-rename.vue';
import ICustomCalender from '~icons/custom/calender.svg';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import type { DateModelType } from 'element-plus';
import type { TimeRange } from '@/types/trend';
import type { TrendTemplate } from '@/types';
import { useTableHistoryTrendStore, useTableRunningTrendStore } from '@/stores/trend';
import { today } from '@/utils/date';
import dayjs from 'dayjs';

const props = withDefaults(
  defineProps<{
    isRunning: boolean;
    canOperate: boolean; // props.measurementGroupInfo.length === 0
    templateList: TrendTemplate[];
  }>(),
  {},
);

const emit = defineEmits<{
  'global-time-change': [payload: TimeRange];
  'running-play': [];
  'running-pause': [];
  'save-template': [payload: string];
  'handle-operate': [payload: { action: string; data: TrendTemplate }];
  'get-query-list': [payload: string];
  'reset-trend': [];
}>();

const { requestFn: upsertTrendTemplate } = useRequest(SearchApi.upsertTrendTemplate);
const { requestFn: delTrendTemplate } = useRequest(SearchApi.delTrendTemplate);

const trendStore = useTableHistoryTrendStore();
const runningTrendStore = useTableRunningTrendStore();

const selectedDateTime = reactive<{
  value: [DateModelType, DateModelType];
}>({
  value: [new Date(trendStore.globalTimeRange.start), new Date(trendStore.globalTimeRange.end)],
});

const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const { t } = useI18n();
const { shortcutsDaterange } = useShortcutsDate();

const isPlaying = ref(false);

const nameList = ref<string[]>([]);
const templateVisible = ref(false);
const renameVisible = ref(false);
const saveTemplateLoading = ref(false);
const selectedTemplateId = ref<number | string>('');
const renameData = reactive<{
  id: number | string;
  name: string;
  type: string;
  template: string;
}>({
  id: '',
  name: '',
  type: '',
  template: '',
});

const setSaveTemplateLoading = (loading: boolean) => {
  saveTemplateLoading.value = loading;
};

const setTemplateVisible = (visible: boolean) => {
  templateVisible.value = visible;
};

const setRenameVisible = (visible: boolean) => {
  renameVisible.value = visible;
};

const setSelectedDateTime = (value: [DateModelType, DateModelType]) => {
  selectedDateTime.value = value;
};

const setRenameData = (data: { id: number | string; name: string; type: string; template: string }) => {
  renameData.id = data.id;
  renameData.name = data.name;
  renameData.type = data.type;
  renameData.template = data.template;
};

defineExpose({
  setSaveTemplateLoading,
  setTemplateVisible,
  setRenameVisible,
  setSelectedDateTime,
  setRenameData,
});

function handleChangeTime(value: [DateModelType, DateModelType]) {
  const start = dayjs(value[0]).valueOf();
  const end = dayjs(value[1]).valueOf();
  if (start >= end) {
    ElMessage.warning({
      message: t('dataTrend.timeTip'),
      grouping: true,
    });
  }
  emit('global-time-change', { start, end });
}

function handleRunningPlay() {
  isPlaying.value = true;
  emit('running-play');
}

function handleRunningPause() {
  isPlaying.value = false;
  emit('running-pause');
}

function handleSaveTemplate() {
  saveTemplateLoading.value = false;
  templateVisible.value = true;
}

function handleSaveSuccess(name: string) {
  emit('save-template', name);
}

function handleRenameSuccess(name: string) {
  saveTemplateLoading.value = true;
  upsertTrendTemplate({
    id: renameData.id,
    type: renameData.type,
    name,
    template: renameData.template,
  })
    .then(() => {
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      renameVisible.value = false;
      emit('get-query-list', '');
    })
    .finally(() => {
      saveTemplateLoading.value = false;
    });
}

function handleTemplateChange(templateId: number | string) {
  const selectedTemplate = props.templateList.find((item) => item.id === templateId);
  if (selectedTemplate) {
    emit('handle-operate', { action: 'open', data: selectedTemplate });
  }
}

function handleTemplateReset() {
  selectedTemplateId.value = '';
  emit('reset-trend');
}

const handleSqlCommand = (val: string, data: TrendTemplate) => {
  if (val === 'delete') {
    ElMessageBox.confirm(`${t('dataTrend.deleteTemplateTip')}：${data.name}`, t('common.notice'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: `del-trend-template-confirm`,
      cancelButtonClass: `del-trend-template-cancel`,
      type: 'warning',
      icon: ICustomMessageWarning,
    }).then(() => {
      delTrendTemplate(+data.id).then(() => {
        ElMessage({
          type: 'success',
          message: `${t('common.deleteSuccess')}`,
        });
        // 如果当前下拉框选中的模板正是被删除的这个，则清空选择并重置趋势
        if (selectedTemplateId.value === data.id) {
          handleTemplateReset();
        }
        emit('get-query-list', '');
      });
    });
  } else {
    emit('handle-operate', { action: val, data });
  }
};

watch(
  () => trendStore.globalTimeRange,
  (newVal) => {
    setSelectedDateTime([new Date(newVal.start), new Date(newVal.end)]);
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.template-select {
  width: 260px;
  margin-left: 16px;
}

:deep(.template-select .el-select__caret) {
  display: none;
}

:deep(.template-select .el-select__wrapper),
:deep(.template-select .el-input__wrapper) {
  background-image: url('../../../assets/icons/search-icon.svg');
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px 18px;
  padding-right: 32px;
}

.save-button {
  border: 1px solid #dfe1ed;
}

.template-select-dropdown .el-select-dropdown__item {
  height: auto;
  padding: 0;
}

.template-select-dropdown .template-option-content {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  width: 100%;
  box-sizing: border-box;
}

.template-select-dropdown .template-option-text {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.template-select-dropdown .template-option-text svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-right: 8px;
}

.template-select-dropdown .template-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #656a85;
}

.template-select-dropdown .template-option-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.template-select-dropdown .item-edit-box,
.template-select-dropdown .item-delete-box {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.template-select-dropdown .item-edit-box svg,
.template-select-dropdown .item-delete-box svg {
  width: 16px;
  height: 16px;
}

.template-select-dropdown .item-edit-active,
.template-select-dropdown .item-delete-active {
  display: none;
}

.template-select-dropdown .item-edit-box:hover .item-edit,
.template-select-dropdown .item-delete-box:hover .item-delete {
  display: none;
}

.template-select-dropdown .item-edit-box:hover .item-edit-active,
.template-select-dropdown .item-delete-box:hover .item-delete-active {
  display: block;
}

.template-select-dropdown .el-select-dropdown__item:hover .template-name {
  color: #495ad4;
}
</style>
