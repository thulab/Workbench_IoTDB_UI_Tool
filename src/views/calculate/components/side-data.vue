<template>
  <div class="search_div max-height">
    <el-input class="filter-input m-b-8" v-model="filterMeasurementText" :placeholder="t('measurement.measurementNamePlaceholder')" @input="getMeasurementList" id="calculate-modal-input-measurement">
      <!-- <template #suffix><i-ep-search /></template> -->
    </el-input>

    <el-table
      border
      v-if="measurementList && measurementList.length > 0"
      :data="measurementList"
      :show-header="false"
      :max-height="190"
      v-loading="measurementLoading"
      tooltip-effect="light"
      cell-class-name="p-y-0"
      :tooltip-options="{ placement: 'left', popperClass: 'table-tooltip-max-width' }"
      @row-dblclick="(row, column, event) => handleAdd(row)"
    >
      <el-table-column align="center" :label="t('measurement.measurement')" v-slot="{ row }" show-overflow-tooltip>
        {{ row.timeseries }}
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';
import type { MeasurementDataItem } from '@/types';

const emit = defineEmits(['get-function']);

const { t } = useI18n();
const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementAllObjList);

const filterMeasurementText = ref('');
const measurementList = ref<MeasurementDataItem[]>([]);

let lastMeasurementQuery = '';
const getMeasurementList = debounce(() => {
  lastMeasurementQuery = filterMeasurementText.value;
  getMeasurement(lastMeasurementQuery).then((res) => {
    if (lastMeasurementQuery === filterMeasurementText.value) {
      measurementList.value = res.data?.measurements?.map((item) => item) || [];
    }
  });
}, 500);

// 添加
function handleAdd(item: MeasurementDataItem) {
  const res = item.timeseries;
  emit('get-function', res);
}

function init() {
  filterMeasurementText.value = '';
  measurementList.value = [];
}

onMounted(() => {
  init();
});
defineExpose({ init });
</script>

<style lang="scss" scoped>
.search_div {
  background: #fff;

  &.maxheight {
    overflow: auto;
  }
}

.filter-input {
  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color)) inset;
  }
}
</style>
