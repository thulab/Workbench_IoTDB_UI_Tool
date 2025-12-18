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
        <button
          @click="handleRunningPlay"
          v-if="props.isRunning"
          class="operate-button"
          :disabled="props.measurementGroupInfo.length === 0"
          :style="props.measurementGroupInfo.length === 0 ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'"
        >
          <el-icon size="22"><VideoPlay /></el-icon>
        </button>
        <button
          @click="handleRunningPause"
          v-if="props.isRunning"
          class="operate-button"
          :disabled="props.measurementGroupInfo.length === 0"
          :style="props.measurementGroupInfo.length === 0 ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'"
        >
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
        <button
          ref="templateButtonRef"
          v-click-outside="onClickOutside"
          class="operate-button"
          :disabled="props.templateList?.length <= 0"
          :style="props.templateList?.length === 0 ? 'cursor:not-allowed;opacity:0.5' : 'cursor:pointer'"
        >
          <el-icon size="30"><i-custom-template /></el-icon>
        </button>
        <el-popover ref="popoverRef" :virtual-ref="templateButtonRef" trigger="click" virtual-triggering width="300">
          <el-input :placeholder="t('search.templatePlaceholder')" v-model="templateFilterText" size="small" @input="getQueryList" :id="`trend-template-search`" style="padding: 2px 2px 0">
            <template #suffix>
              <i-custom-search-icon />
            </template>
          </el-input>
          <ul class="template-list">
            <template v-if="templateList.length">
              <li v-for="item in templateList" :key="item.id" :id="`trend-template-${item.id}`" class="template-item-box" @click="(e) => handleSelect(item, e)">
                <div class="template-item-text-box">
                  <i-custom-template />
                  <text-tooltip :content="item.name" class-name="template-item-text" />
                </div>
                <div class="item-edit-box" :id="`trend-template-rename-${item.id}`" @click="handleSqlCommand('rename', item)">
                  <i-custom-edit class="item-edit" />
                  <i-custom-edit class="item-edit-active" />
                </div>

                <div class="item-delete-box" :id="`trend-template-delete-${item.id}`" @click="handleSqlCommand('delete', item)">
                  <i-custom-delete class="item-delete" />
                  <i-custom-delete-active class="item-delete-active" />
                </div>
              </li>
            </template>
            <div class="list-empty-wrapper" v-else>
              <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
              <span class="data-empty-text">{{ t('common.noData') }}</span>
            </div>
          </ul>
        </el-popover>
      </div>
    </div>
    <div>
      <el-scrollbar height="100%">
        <div>
          <MetricChartGroup
            v-for="(group, index) in props.measurementGroupInfo"
            :isRunning="props.isRunning"
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
            :realTimeData="filteredRealTimeData(group)"
            @drop="handleMeasurementDrop"
            @delete-group="handleDeleteGroup"
            @marker-change="updateMarker"
            @marker-value-change="handleMarkerValueChange"
            @delete-measurement="handleDeleteMeasurement"
          />
          <MetricChartGroup
            v-if="props.measurementGroupInfo.length === 0"
            :isRunning="props.isRunning"
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
import type { DateModelType, PopoverInstance } from 'element-plus';
import { VideoPlay, VideoPause } from '@element-plus/icons-vue';
import { SearchApi } from '@/api';
import type { TrendTemplate, TrendData } from '@/types';
import { ref } from 'vue';
import { ClickOutside as vClickOutside } from 'element-plus';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import { useTableHistoryTrendStore } from '@/stores/trend';

const trendStore = useTableHistoryTrendStore();

const { requestFn: upsertTrendTemplate } = useRequest(SearchApi.upsertTrendTemplate);
const { requestFn: delTrendTemplate } = useRequest(SearchApi.delTrendTemplate);

const templateFilterText = ref('');
// const templateList = ref<TrendTemplate[]>([]);

const templateButtonRef = ref();
const popoverRef = ref<PopoverInstance>();
const onClickOutside = () => {
  if (popoverRef.value) {
    popoverRef.value.hide();
  }
};

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
    realTimeData?: TrendData[];
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
  'running-play': [];
  'running-pause': [];
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

defineExpose({
  deleteMeasurementMarkerDataByName,
  setSaveTemplateLoading,
  setTemplateVisible,
  setRenameData,
  setRenameVisible,
  setSelectedDateTime,
  restoreChartData,
});

function handleRunningPlay() {
  emit('running-play');
}

function handleRunningPause() {
  emit('running-pause');
}

function convertPath(original: string): string {
  const firstParen = original.indexOf('(');
  const lastParen = original.indexOf(')');
  if (firstParen === -1 || lastParen === -1 || lastParen <= firstParen) {
    return original;
  }
  const prefix = original.slice(0, firstParen);
  const lastDotIndex = prefix.lastIndexOf('.');
  const dbTb = prefix.slice(0, lastDotIndex);
  const measurement = prefix.slice(lastDotIndex + 1);
  const devices = original.slice(firstParen + 1, lastParen).split(', ');
  const device = devices.join('.');
  const processed = `${dbTb}.${device}.${measurement}`;
  console.log('prefix:', prefix);
  console.log('dbTb:', dbTb);
  console.log('measurement:', measurement);
  console.log('device:', device);

  // const processed = original.slice(0, firstParen + 1) + original.slice(firstParen + 1, lastParen).replace(/,/g, '.') + original.slice(lastParen);
  console.log('converted path from', original, 'to', processed);
  return processed;
}

function filteredRealTimeData(group: ChartGroupInput): TrendData[] {
  const result: TrendData[] = [];
  for (const item of props.realTimeData || []) {
    if (group.members.some((measurement) => measurement.label === convertPath(item.path))) {
      result.push(item);
    }
  }
  return result;
}

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
      emit('get-query-list', templateFilterText.value);
    })
    .finally(() => {
      saveTemplateLoading.value = false;
    });
}

function getQueryList() {
  // Placeholder for fetching template list based on templateFilterText
  // This function should update the template list displayed in the popover
  emit('get-query-list', templateFilterText.value);
}

const canStopPropagation = (e: HTMLElement): boolean => {
  const { classList } = e;

  if (
    classList.contains('item-edit-box') ||
    classList.contains('item-delete-box') ||
    classList.contains('item-edit') ||
    classList.contains('item-delete') ||
    classList.contains('item-edit-active') ||
    classList.contains('item-delete-active')
  ) {
    return true;
  }
  if ((e.tagName === 'path' || e.tagName === 'g') && e.parentElement) {
    return canStopPropagation(e.parentElement);
  }
  return false;
};

function handleSelect(data: TrendTemplate, e: MouseEvent) {
  if (canStopPropagation(e.target as HTMLElement)) return;
  emit('handle-operate', { action: 'open', data });
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
        getQueryList();
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
.template-list {
  overflow-y: auto;
  height: calc(100% - 46px);
  margin: 16px 2px 0;

  .template-item-box {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 24px;
    font-size: 12px;
    font-weight: 300;
    line-height: 1.2;
    color: #656a85;
    cursor: pointer;

    .template-item-text-box {
      display: flex;
      align-items: center;

      /* width: 160px; */

      svg {
        margin-right: 8px;
        width: 24px;
        height: 24px;
        flex: 0 0 24px;
      }
    }

    .item-delete-box {
      position: absolute;
      top: 4px;
      right: 4px;
      display: none;

      svg {
        width: 16px;
        height: 16px;
      }

      .item-delete-active {
        display: none;
      }

      &:hover {
        .item-delete {
          display: none;
        }

        .item-delete-active {
          display: block;
        }
      }
    }

    .item-edit-box {
      position: absolute;
      top: 4px;
      right: 20px;
      display: none;

      svg {
        width: 16px;
        height: 16px;
      }

      .item-edit-active {
        display: none;

        :deep(path) {
          fill: #495ad4 !important;
        }
      }

      &:hover {
        .item-edit {
          display: none;
        }

        .item-edit-active {
          display: block;
        }
      }
    }

    &:hover {
      background-color: #f7f8fc;
      color: #495ad4;

      .item-delete-box {
        display: block;
      }

      .item-edit-box {
        display: block;
      }
    }

    .more-icon {
      cursor: pointer;
      margin-left: 12px;
      font-size: 14px;

      svg {
        // transform: rotate(90deg);
      }

      svg:focus {
        outline: none;
      }
    }
  }

  .template-box-empty {
    padding: 0 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #656a85;
  }
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
}

.operate-button {
  width: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>
