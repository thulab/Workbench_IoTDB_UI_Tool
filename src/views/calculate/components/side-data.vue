<template>
  <div class="search_div maxheight">
    <el-input class="m-b-8 filter-input" v-model="filterMeasurementText" placeholder="请输入测点名称" @input="getMeasurementList">
      <!-- <template #suffix><i-ep-search /></template> -->
    </el-input>

    <el-table
      v-if="measurementList && measurementList.length > 0"
      :data="measurementList"
      :max-height="130"
      v-loading="measurementLoading"
      tooltip-effect="light"
      :tooltip-options="{ placement: 'left' }"
      @row-dblclick="(row, column, event)=>handleAdd(row)">
      <el-table-column align="center" label="测点" v-slot="{ row }" show-overflow-tooltip>
        {{ row.timeseries }}
      </el-table-column>
    </el-table>
  </div>

</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';

const emit = defineEmits(['get-function']);

const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementAllObjList);

const filterMeasurementText = ref('');
const measurementList = ref<StorageDevice.MeasurementDataItem[]>([]);

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
function handleAdd(item: StorageDevice.MeasurementDataItem) {
  const res = item.timeseries;
  emit('get-function', res);
}

onMounted(() => {
  filterMeasurementText.value = '';
  measurementList.value = [];
});

</script>

<style lang="scss" scoped>
.search_div {
  background: #fff;

  &.maxheight {
    overflow: auto;
  }
}

.filter-input{
  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color)) inset;
  }
}
</style>
