<template>
  <div>
    <el-select
      v-model="model"
      :placeholder="placeholder ? placeholder : t('measurement.measurementNameSelectPlaceholder')"
      filterable
      remote
      :clearable="isClearable"
      :remote-show-suffix="showSuffix"
      fit-input-width
      :remote-method="remoteMethod"
      :loading="measurementLoading"
      :disabled="disabledSelect"
      :style="`width: ${selectWidth}px;`"
      class="remote-select-box"
      id="select-path-single"
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
        <div :style="`display: flex; width: ${itemWidth}px;`">
          <text-tooltip :content="item.timeseries" />
        </div>
      </el-option>
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';

const props = defineProps<{
  modelValue: string | undefined;
  disabledSelect?: boolean;
  showSuffix?: boolean;
  isClearable?: boolean;
  disabledPath?: (data: StorageDevice.MeasurementDataItem) => boolean;
  selectWidth: number;
  itemWidth: number;
  filterSystem?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (event: 'handleChangePath', val: string): void;
}>();

const { t } = useI18n();
const model = useVModel(props, 'modelValue');
const measurementList = ref<StorageDevice.MeasurementDataItem[]>([]);

const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementAllObjList);

let lastMeasurementQuery = '';
const remoteMethod = debounce((query: string) => {
  lastMeasurementQuery = query;
  getMeasurement(lastMeasurementQuery).then((res) => {
    if (lastMeasurementQuery === query) {
      let measurements = res.data?.measurements || [];
      if (props.filterSystem) {
        measurements = measurements.filter((item) => !item.timeseries.startsWith('root.__system'));
      }
      measurementList.value = measurements;
    }
  });
}, 500);

function handleChangePath(val: string) {
  emit('handleChangePath', val);
}

onMounted(() => {
  remoteMethod('');
});

defineExpose({
  measurementList,
});
</script>

<style scoped lang="scss">
.remote-select-box {
  position: relative;
}
</style>
