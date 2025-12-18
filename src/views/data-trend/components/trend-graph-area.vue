<template>
  <div class="trend-graph-area-wrapper" ref="wrapperRef">
    <div class="operate-button-row">
      <div v-if="!props.isRunning">
        <div>
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
      <div class="operate-button-group">
        <button v-if="props.isRunning" class="operate-button">
          <el-icon size="22"><VideoPlay /></el-icon>
        </button>
        <button v-if="props.isRunning" class="operate-button">
          <el-icon size="22"><VideoPause /></el-icon>
        </button>
        <button
          @click="handleSaveTemplate"
          class="operate-button"
          :disabled="props.measurementGroupInfo.length === 0"
          :style="props.measurementGroupInfo.length === 0 ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'"
        >
          <el-icon size="30"><i-custom-sql-save /></el-icon>
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
    </div>
    <div>
      <el-scrollbar height="100%">
        <div>
          <MetricChartGroup
            v-for="(group, index) in props.measurementGroupInfo"
            :ref="(el) => el && chartRefs[group.id] === el"
            :id="group.id"
            :key="group.id"
            :group="group"
            :index="index"
            :range="trendStore.visibleTimeRange"
            :markers="props.markers"
            :height="chartHeight"
            :loading="props.loading"
            :need-fetch-data="props.needFetchGroupsId?.includes(group.id)"
            :can-delete="props.measurementGroupInfo.length > 1"
            @drop="handleMeasurementDrop"
            @delete-group="handleDeleteGroup"
            @marker-change="updateMarker"
            @marker-value-change="handleMarkerValueChange"
            @delete-measurement="handleDeleteMeasurement"
          />
          <MetricChartGroup
            v-if="props.measurementGroupInfo.length === 0"
            :group="{ id: 'default', members: [] }"
            :index="0"
            :range="trendStore.visibleTimeRange"
            :markers="props.markers"
            :height="chartHeight"
            :loading="props.loading"
            :need-fetch-data="false"
            :can-delete="false"
            @drop="handleMeasurementDrop"
            @delete-group="handleDeleteGroup"
            @marker-change="updateMarker"
            @marker-value-change="handleMarkerValueChange"
            @delete-measurement="handleDeleteMeasurement"
          />
        </div>
      </el-scrollbar>
    </div>
    <modal-template v-model:visible="templateVisible" :name-list="nameList" :save-loading="saveTemplateLoading" @handleSave="handleSaveSuccess" />
    <modal-template-rename v-model:visible="renameVisible" :old-name="renameData.name" :name-list="nameList" :save-loading="saveTemplateLoading" @handleSave="handleRenameSuccess" />
  </div>
</template>

<script lang="ts" setup>
import MetricChartGroup from './metric-chart-group.vue';
import ModalTemplate from './modal-template.vue';
import ModalTemplateRename from './modal-template-rename.vue';
import ICustomCalender from '~icons/custom/calender.svg';
import type { TimeRange, ChartMarker, ChartGroupInput, MeasurementMarkerData } from '@/types/trend';
import dayjs from 'dayjs';
import { today } from '@/utils/date';
import type { DateModelType } from 'element-plus';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';
import { SearchApi } from '@/api';
import type { TrendTemplate } from '@/types';
import { ref } from 'vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import { useTableHistoryTrendStore } from '@/stores/trend';

const trendStore = useTableHistoryTrendStore();
const { requestFn: upsertTrendTemplate } = useRequest(SearchApi.upsertTrendTemplate);
const { requestFn: delTrendTemplate } = useRequest(SearchApi.delTrendTemplate);
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

const nameList = ref<string[]>([]);
const templateVisible = ref(false);
const renameVisible = ref(false);
const saveTemplateLoading = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const wrapperHeight = ref(0);
let observer: ResizeObserver | null = null;

const props = withDefaults(
  defineProps<{
    isRunning: boolean;
    markers: ChartMarker[];
    measurementGroupInfo: ChartGroupInput[];
    loading?: boolean;
    needFetchGroupsId?: string[];
    templateList: TrendTemplate[];
  }>(),
  {},
);

const chartRefs = ref<Record<string, InstanceType<typeof MetricChartGroup>>>({});

const chartHeight = computed(() => {
  if (wrapperRef.value) {
    const availableHeight = wrapperHeight.value - 120; // 减去操作按钮行的高度
    const groupCount = props.measurementGroupInfo.length || 1; // 至少有
    if (groupCount > 3) {
      return Math.floor(availableHeight / 3);
    } else {
      return Math.floor(availableHeight / groupCount);
    }
  }
  return 230;
});

const emit = defineEmits<{
  'global-time-change': [payload: TimeRange];
  'marker-change': [payload: { id: string; timestamp: number }];
  'merge-into-group': [payload: { groupId: string; measurementPath: string }];
  'delete-group': [payload: { groupId: string }];
  'delete-measurement': [payload: { groupId: string; measurementPath: string }];
  'marker-value-change': [payload: MeasurementMarkerData[]];
  'save-template': [payload: string];
  'handle-operate': [payload: { action: string; data: TrendTemplate }];
  'get-query-list': [payload: string];
  'reset-trend': [];
}>();

const { t } = useI18n();
const { shortcutsDaterange } = useShortcutsDate();
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const selectedDateTime = reactive<{
  value: [DateModelType, DateModelType];
}>({
  value: [new Date(trendStore.visibleTimeRange.start), new Date(trendStore.visibleTimeRange.end)],
});
const measurementsMarkerData = ref<MeasurementMarkerData[]>([]);

const deleteMeasurementMarkerDataByName = (name: string) => {
  const index = measurementsMarkerData.value.findIndex((item) => item.name === name);
  measurementsMarkerData.value.splice(index, 1);
};

const setSaveTemplateLoading = (loading: boolean) => {
  saveTemplateLoading.value = loading;
};

const setTemplateVisible = (visible: boolean) => {
  templateVisible.value = visible;
};

const setRenameData = (data: { id: number | string; name: string; type: string; template: string }) => {
  renameData.id = data.id;
  renameData.name = data.name;
  renameData.type = data.type;
  renameData.template = data.template;
};

const setRenameVisible = (visible: boolean) => {
  renameVisible.value = visible;
};

const setSelectedDateTime = (value: [DateModelType, DateModelType]) => {
  selectedDateTime.value = value;
};

const restoreChartData = () => {
  Object.values(chartRefs.value).forEach((chartRef) => {
    chartRef.restoreData();
  });
};

const resetSelectedTemplate = () => {
  selectedTemplateId.value = '';
};

defineExpose({
  deleteMeasurementMarkerDataByName,
  setSaveTemplateLoading,
  setTemplateVisible,
  setRenameData,
  setRenameVisible,
  setSelectedDateTime,
  restoreChartData,
  resetSelectedTemplate,
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
        emit('get-query-list', '');
      });
    });
  } else {
    emit('handle-operate', { action: val, data });
  }
};

function handleMarkerValueChange(payload: MeasurementMarkerData[]) {
  payload.forEach((newData) => {
    const index = measurementsMarkerData.value.findIndex((item) => item.name === newData.name);
    if (index === -1) {
      measurementsMarkerData.value.push(newData);
    } else {
      measurementsMarkerData.value[index] = newData;
    }
  });
  emit('marker-value-change', measurementsMarkerData.value);
}

function updateMarker(payload: { id: string; timestamp: number }) {
  emit('marker-change', payload);
}

function handleMeasurementDrop(payload: { groupId: string; measurementPath: string }) {
  emit('merge-into-group', payload);
}

function handleDeleteGroup(payload: { groupId: string }) {
  emit('delete-group', payload);
}

function handleDeleteMeasurement(payload: { groupId: string; measurementPath: string }) {
  emit('delete-measurement', payload);
}

onMounted(() => {
  if (wrapperRef.value) {
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        wrapperHeight.value = entry.contentRect.height;
      }
    });
    observer.observe(wrapperRef.value);
  }
});

onBeforeUnmount(() => {
  if (observer && wrapperRef.value) {
    observer.unobserve(wrapperRef.value);
    observer = null;
  }
});
</script>

<style lang="scss" scoped>
.template-select {
  width: 200px;
  margin-left: 8px;
}
</style>

<style>
.el-scrollbar__wrap {
  overflow-x: hidden;
}

.trend-graph-area-wrapper {
  width: 100%;
  flex: 1;
  overflow: auto;
  box-sizing: border-box;
  padding: 15px 16px;
}

.operate-button-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.operate-button-group {
  display: flex;
  align-items: center;
}

.operate-button {
  width: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.template-select-dropdown .el-select-dropdown__item {
  height: auto;
  padding: 0;
}

.template-select-dropdown .template-option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  width: 100%;
}

.template-select-dropdown .template-option-text {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
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
  display: none;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.template-select-dropdown .el-select-dropdown__item:hover .template-option-actions {
  display: flex;
}

.template-select-dropdown .item-edit-box,
.template-select-dropdown .item-delete-box {
  cursor: pointer;
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

.template-select-dropdown .item-edit-box:hover .item-edit {
  display: none;
}

.template-select-dropdown .item-edit-box:hover .item-edit-active {
  display: block;
}

.template-select-dropdown .item-delete-box:hover .item-delete {
  display: none;
}

.template-select-dropdown .item-delete-box:hover .item-delete-active {
  display: block;
}

.template-select-dropdown .el-select-dropdown__item:hover .template-name {
  color: #495ad4;
}
</style>
