<template>
  <div class="measurement-detail-wrapper">
    <h4 class="info-title">
      <div style="display: inline-flex; max-width: calc(100% - 100px)">
        <text-tooltip :content="currentMeasurement" />
      </div>
      {{ t('measurement.info') }}
    </h4>
    <div class="measurement-info-box" v-loading="infoLoading">
      <ul class="measurement-info-list">
        <li class="measurement-info-item" id="timeseries-name-li">
          <span class="measurement-info-item-label" id="timeseries-name-span">{{ t('measurement.measurementName') }}：</span>
          <div :style="`display: inline-flex; max-width: 200px;`">
            <text-tooltip :content="measurementInfos.timeseries" />
          </div>
        </li>
        <li class="measurement-info-item" id="description-li">
          <span class="measurement-info-item-label" id="description-span">{{ t('measurement.measurementDescription') }}：</span>
          <div class="description-box">
            <div class="description-text">
              <text-tooltip :content="measurementInfos.description || '-'" />
            </div>
            <div v-if="measurementInfos.viewType !== 'VIEW'" class="edit-box flex-align-center" @click="handleEditDescription">
              <i-custom-edit-normal class="edit-icon" />
              <i-custom-edit-active class="edit-icon-active" />
            </div>
          </div>
        </li>
        <li class="measurement-info-item" id="measurementType-li">
          <span class="measurement-info-item-label" id="measurementType-span">{{ t('measurement.measurementType') }}：</span>
          {{ measurementInfos.viewType === 'VIEW' ? `${pageText}` : t('measurement.baseMeasurement') }}
        </li>
        <li class="measurement-info-item" id="deviceAlign-li">
          <span class="measurement-info-item-label" id="deviceAlign-span">{{ t('measurement.deviceAlign') }}：</span>
          {{ typeof measurementInfos.isAligned === 'boolean' ? (measurementInfos.isAligned ? t('measurement.deviceAlignMeasurement') : t('measurement.undeviceAlignMeasurement')) : '-' }}
        </li>
        <li class="measurement-info-item" id="dataType-li">
          <span class="measurement-info-item-label" id="dataType-span">{{ t('measurement.dataType') }}：</span>
          {{ measurementInfos.dataType || '-' }}
        </li>
        <li class="measurement-info-item" id="encoding-li">
          <span class="measurement-info-item-label" id="encoding-span">{{ t('measurement.encoding') }}：</span>
          {{ measurementInfos.encoding || '-' }}
        </li>
        <li class="measurement-info-item" id="compression-li">
          <span class="measurement-info-item-label" id="compression-span">{{ t('measurement.compression') }}：</span>
          {{ measurementInfos.compression || '-' }}
        </li>
        <li class="measurement-info-item" id="lastValue-li">
          <span class="measurement-info-item-label" id="lastValue-span">{{ t('measurement.lastValue') }}：</span>
          {{ rowReadWriteDataByPath(currentMeasurement) ? measurementInfos.latest || '-' : t('common.noAuth') }}
        </li>
        <li class="measurement-info-item" id="lastValueTime-li">
          <span class="measurement-info-item-label" id="lastValueTime-span">{{ t('measurement.lastValueTime') }}：</span>
          {{ rowReadWriteDataByPath(currentMeasurement) ? measurementInfos.latestTime || '-' : t('common.noAuth') }}
        </li>
      </ul>

      <div class="operate-button-list">
        <el-button type="primary" size="small" @click="handleData" :id="`${currentMeasurement}-data`">{{ t('measurement.viewData') }}</el-button>
        <el-tooltip
          v-if="appType === 1"
          placement="top-start"
          effect="light"
          trigger="hover"
          :content="t('measurement.goAlarmTip')"
          :disabled="measurementInfos.dataType !== 'TEXT'"
          popper-class="tooltip-box-width"
        >
          <el-button size="small" :disabled="measurementInfos.dataType === 'TEXT'" @click="handleAlarm" :id="`${currentMeasurement}-alarm`">
            {{ t('measurement.viewAlarm') }}
          </el-button>
        </el-tooltip>
        <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('measurement.goTrendTip')" :disabled="measurementInfos.dataType !== 'TEXT'" popper-class="tooltip-box-width">
          <el-button size="small" :disabled="measurementInfos.dataType === 'TEXT'" @click="handleTrend" :id="`${currentMeasurement}-trend`">
            {{ t('measurement.viewTrend') }}
          </el-button>
        </el-tooltip>
        <auth-tooltip :is-disabled="rowCanWriteSchemaByPath(currentMeasurement)" :content="'common.schemaAuthAnother'">
          <el-button size="small" :disabled="!rowCanWriteSchemaByPath(currentMeasurement)" @click="handleDelMeasurement" :id="`mesaurement-table-${currentMeasurement}-del`">
            {{ t('common.delete') }}
          </el-button>
        </auth-tooltip>
      </div>
    </div>

    <h4 class="info-title">
      <div style="display: inline-flex; max-width: calc(100% - 100px)">
        <text-tooltip :content="currentMeasurement" />
      </div>
      {{ t('measurement.newValList') }}
    </h4>
    <auth-container :is-auth="rowReadWriteDataByPath(currentMeasurement)" :content="'common.dataAuth'" style="flex: 1; overflow: auto">
      <div class="measurement-table-details" v-loading="loading">
        <dynamic-table
          :columns="columns"
          :table-data="tableDataPagination"
          :height="maxTableHeight"
          :max-height="maxTableHeight"
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="tableData.length"
          :show-pagination="true"
          :default-sort="defaultSort"
          @handleSortChange="handleSortChange"
        />
      </div>
    </auth-container>

    <modal-description v-model:visible="descriptionVisible" :measurement="currentMeasurement" :description="measurementInfos.description || ''" @handleSave="getDetail" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import type { Sort } from 'element-plus';
import { useTableHeight } from '@/composition-api';
import { SearchApi, StorageApi } from '@/api';
import { useUserStore } from '@/stores';
import { getPathAuthList } from '@/utils/auth';
import { todayNow } from '@/utils/date';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import ModalDescription from './modal-description.vue';
import type { MeasurementData, TreeEventPayload } from '@/types';

const props = defineProps<{
  currentMeasurement: string;
}>();

const emit = defineEmits<{
  (event: 'handleReload'): void;
  (event: 'handleDelete', payload: TreeEventPayload): void;
}>();

const { t } = useI18n();
const router = useRouter();
const appType = Number(import.meta.env.VITE_APP_TYPE);
const pageText = appType === 1 ? t('measurement.calculateMeasurement') : t('measurement.viewMeasurement');
const userStore = useUserStore();
const { userAllEntityPrivileges, userAllPathPrivileges } = storeToRefs(userStore);

const { maxTableHeight } = useTableHeight(334);
const measurementInfos = ref<MeasurementData>({
  timeseries: '',
  node: '',
  description: '',
  viewType: '',
  isAligned: false,
  dataType: '',
  encoding: '',
  compression: '',
  latest: '',
  latestTime: '',
});
const descriptionVisible = ref(false);
const columns = ref<globalThis.DynamicTableColumn[]>([]);
const tableData = ref<Record<string, any>[]>([]);
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
  columnSize: 100,
  columnNum: 1,
  totalColumnPage: 0,
  totalColumnCount: 0,
});
const getListLoading = ref(false);
const defaultSort = ref<Sort>({ prop: 't0', order: 'descending' });
const tableDataPagination = computed(() => tableData.value.slice(((pagination.pageNum || 1) - 1) * pagination.pageSize, (pagination.pageNum || 1) * pagination.pageSize));

const { requestFn: getMeasurementsInfo, loading: infoLoading } = useRequest(StorageApi.getMeasurementsInfo);
const { requestFn: getList, loading } = useRequest(SearchApi.getDataSearchList);
const { requestFn: deleteMeasurements } = useRequest(StorageApi.deleteMeasurements);

const canReadWriteSchemaByPath = computed(() => {
  if (userAllEntityPrivileges.value.includes('READ_SCHEMA') || userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  if (!props.currentMeasurement) return false;
  const authList = getPathAuthList(props.currentMeasurement, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('READ_SCHEMA') || authList.includes('WRITE_SCHEMA');
  }
  return false;
});

function rowCanWriteSchemaByPath(path: string) {
  if (userAllEntityPrivileges.value.includes('WRITE_SCHEMA')) return true;
  const authList = getPathAuthList(path, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('WRITE_SCHEMA');
  }
  return false;
}

function rowReadWriteDataByPath(path: string) {
  if (userAllEntityPrivileges.value.includes('READ_DATA') || userAllEntityPrivileges.value.includes('WRITE_DATA')) return true;
  const authList = getPathAuthList(path, userAllPathPrivileges.value);
  if (authList.length) {
    return authList.includes('READ_DATA') || authList.includes('WRITE_DATA');
  }
  return false;
}

// 获取测点详情
function getDetail() {
  getMeasurementsInfo(props.currentMeasurement).then((res) => {
    measurementInfos.value = res.data;
  });
}

function getListData() {
  columns.value = [];
  tableData.value = [];
  getListLoading.value = true;
  getList({
    measurements: [props.currentMeasurement],
    startTime: new Date('1970-1-1').getTime(),
    endTime: todayNow(),
    aggregation: '',
    timeInterval: undefined,
    unitInterval: '',
    asc: defaultSort.value.order === 'ascending' ? 'asc' : 'desc',
    spage: pagination.columnNum,
    ssize: pagination.columnSize,
    size: 1000,
    page: pagination.pageNum,
  })
    .then((res) => {
      const list: globalThis.DynamicTableColumn[] = [];
      res.data?.metaDataList?.forEach((item: string, index: number) => {
        list.push({
          label: item,
          prop: `t${index}`,
          defaultValue: '-',
          fixed: index === 0 ? 'left' : undefined,
          sortable: index === 0 ? 'custom' : false,
          // formatHeader: formatTimeseries,
        });
      });
      columns.value = list;
      tableData.value = res.data?.valueList?.map((item: any[]) => {
        const obj = {} as Record<string, string>;
        item.forEach((childItem, index) => {
          obj[`t${index}`] = childItem;
        });
        return obj;
      });
      pagination.totalColumnPage = res.data?.totalColumnPage;
      pagination.totalColumnCount = res.data?.totalColumnCount;
    })
    .finally(() => {
      getListLoading.value = false;
    });
}

function handleSortChange(data: { column: any; prop: string; order: any }) {
  defaultSort.value = { prop: 't0', order: data.order || 'descending' };
  getListData();
}

function handleEditDescription() {
  descriptionVisible.value = true;
}

function handleData() {
  router.push({
    name: 'DataSearch',
    query: {
      measurement: props.currentMeasurement,
    },
  });
}

function handleAlarm() {
  router.push({
    name: 'AlarmConfig',
    query: {
      measurement: props.currentMeasurement,
    },
  });
}

function handleTrend() {
  router.push({
    name: 'TrendDetail',
    query: {
      measurement: props.currentMeasurement,
    },
  });
}

function handleDelMeasurement() {
  ElMessageBox.confirm(`${t('measurement.deleteMeasurementSingle')}`, t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'mesaurement-del-confirm',
    cancelButtonClass: 'mesaurement-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    deleteMeasurements([props.currentMeasurement]).then(() => {
      ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
      emit('handleDelete', { path: props.currentMeasurement, type: 'MEASUREMENT' });
    });
  });
}

watch(
  () => props.currentMeasurement && canReadWriteSchemaByPath.value,
  (val) => {
    if (val) {
      getDetail();
    }
  },
  {
    immediate: true,
  },
);

watch(
  () => props.currentMeasurement && rowReadWriteDataByPath(props.currentMeasurement),
  (val) => {
    if (val) {
      getListData();
    }
  },
  {
    immediate: true,
  },
);
</script>
<style lang="scss" scoped>
.measurement-detail-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.measurement-info-box {
  display: flex;
  justify-content: space-between;
  padding: 8px;
}

.measurement-info-list {
  flex: 1;
}

.measurement-info-item {
  font-size: 12px;
  line-height: 32px;
  color: #656a85;
  margin: 0 36px 0 0;
  display: inline-flex;
  align-items: center;

  &:last-child {
    margin-right: 0;
  }

  .measurement-info-item-label {
    color: #131926;
    position: relative;
    margin-right: 4px;
    white-space: nowrap;
  }
}

.info-title {
  font-size: 12px;
  font-weight: 700;
  line-height: 21px;
  color: #495ad4;
  padding: 14px 0 6px 8px;
  border-bottom: 1px solid #dfe1ed;
}

.description-box {
  display: flex;
  align-items: center;
  justify-content: center;

  .description-text {
    max-width: 120px;
    display: flex;
  }

  .edit-box {
    flex: 0 0 16px;
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }

    .edit-icon-active {
      display: none;
    }

    &:hover {
      .edit-icon {
        display: none;
      }

      .edit-icon-active {
        display: block;
      }
    }
  }
}

.operate-button-list {
  margin-left: 46px;
  display: flex;
  flex-wrap: nowrap;
}

.measurement-table-details {
  margin: 8px;
  padding: 8px;
  background-color: #f7f8fc;
}
</style>
