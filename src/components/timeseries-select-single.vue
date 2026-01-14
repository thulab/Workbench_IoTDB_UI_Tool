<template>
  <el-select
    v-model="model"
    :id="id"
    :placeholder="placeholder ? placeholder : t('measurement.measurementNameSelectPlaceholder')"
    filterable
    remote
    :clearable="isClearable"
    :remote-show-suffix="showSuffix"
    fit-input-width
    :remote-method="remoteMethod"
    :disabled="disabledSelect"
    :style="`width: ${selectWidth}px;`"
    class="remote-select-box"
    popper-class="overflow-popper"
    :popper-style="`width: ${itemWidth}px !important;`"
    @change="handleChangePath"
  >
    <el-option
      v-for="item in measurementList"
      :key="item.timeseries"
      :label="item.timeseries"
      :value="item.timeseries"
      :id="`select-path-single-${item.timeseries}`"
      :disabled="disabledPath ? disabledPath(item) : false"
    >
      <div :style="`display: flex; width: 100%;`">
        <text-tooltip :content="item.timeseries" />
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';
import type { MeasurementDataItem } from '@/types';

const props = defineProps<{
  modelValue: string | undefined;
  id: string;
  disabledSelect?: boolean;
  showSuffix?: boolean;
  isClearable?: boolean;
  disabledPath?: (data: MeasurementDataItem) => boolean;
  selectWidth: number;
  itemWidth: number;
  filterSystem?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', val: string): void;
  (event: 'handleChangePath', val: string, data: MeasurementDataItem[]): void;
}>();

const { t } = useI18n();
const model = useVModel(props, 'modelValue');
const measurementList = ref<MeasurementDataItem[]>([]);

const { requestFn: getMeasurement } = useRequest(StorageApi.getMeasurementAllObjList);

let lastMeasurementQuery = '';
const remoteMethod = debounce((query: string) => {
  lastMeasurementQuery = query;
  getMeasurement(lastMeasurementQuery).then((res) => {
    if (lastMeasurementQuery === query) {
      let measurements = res.data?.measurements || [];
      if (props.filterSystem) {
        measurements = measurements.filter((item) => !item.timeseries.startsWith('root.__system.'));
      }
      measurementList.value = measurements;
    }
  });
}, 500);

function handleChangePath(val: string) {
  emit('handleChangePath', val, measurementList.value);
}

defineExpose({
  measurementList,
});
</script>

<style scoped lang="scss">
.remote-select-box {
  position: relative;
}
</style>
