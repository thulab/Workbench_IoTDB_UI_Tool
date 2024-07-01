<template>
  <el-select
    class="remote-select-box"
    v-model="model"
    :id="id"
    :placeholder="t(placeholder)"
    filterable
    remote
    clearable
    multiple
    collapse-tags
    :collapse-tags-tooltip="false"
    fit-input-width
    :remote-method="remoteMethod"
    :style="`width: ${selectWidth}px;`"
    :disabled="disabledSelect"
    @change="handleChangePath"
  >
    <template #prefix v-if="showPrefix">
      <el-icon class="remote-select-search-icon" size="20"><i-custom-search-icon /></el-icon>
    </template>
    <el-option
      v-for="item in measurementList"
      :key="item.timeseries"
      :label="item.timeseries"
      :value="item.timeseries"
      :id="`timeseries-select-${item.timeseries}`"
      :disabled="disabledPath ? disabledPath(item) : false"
    >
      <div :style="`display: flex; width: ${itemWidth}px;`">
        <text-tooltip :content="item.timeseries" />
      </div>
    </el-option>
  </el-select>
  <el-button v-if="isShowViewBtn" type="primary" :disabled="!model.length" class="m-l-12" @click="() => (dialogVisible = true)">{{ t(viewText) }}</el-button>
  <el-dialog :title="t(viewText)" v-model="dialogVisible" class="select-modal" align-center width="520px">
    <el-scrollbar :max-height="400">
      <ul class="select-list">
        <li v-for="(item, index) in model" :key="item" class="select-item">
          <span class="select-item-text"><text-tooltip :content="item" /></span>
          <div class="select-item-delete-box" @click="handleDelete(index)">
            <i-custom-delete class="select-item-delete" />
            <i-custom-delete-active class="select-item-delete-active" />
          </div>
        </li>
      </ul>
    </el-scrollbar>
  </el-dialog>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';

const props = withDefaults(
  defineProps<{
    modelValue: Array<string>;
    id: string;
    isShowViewBtn?: boolean;
    placeholder?: string;
    viewText?: string;
    filterSystem?: boolean;
    showPrefix?: boolean;
    disabledSelect?: boolean;
    disabledPath?: (data: StorageDevice.MeasurementDataItem) => boolean;
    selectWidth?: number;
    itemWidth?: number;
  }>(),
  {
    placeholder: 'measurement.measurementNameSelectPlaceholder',
    isShowViewBtn: true,
    viewText: 'dataTrend.choosedMeasurement',
    showPrefix: true,
    selectWidth: 336,
    itemWidth: 284,
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', vals: string[]): void;
  (event: 'handleChangePath', vals: string[], data: StorageDevice.MeasurementDataItem[]): void;
}>();

const { t } = useI18n();
const model = useVModel(props, 'modelValue');
const dialogVisible = ref(false);
const measurementList = ref<StorageDevice.MeasurementDataItem[]>([]);

const { requestFn: getMeasurement } = useRequest(StorageApi.getMeasurementAllObjList);

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

function handleDelete(index: number) {
  model.value?.splice(index, 1);
}

function handleChangePath(vals: string[]) {
  emit('handleChangePath', vals, measurementList.value);
}

defineExpose({
  measurementList,
});
</script>

<style scoped lang="scss">
.remote-select-box {
  position: relative;

  :deep(.el-select-v2__wrapper) {
    padding-left: 20px;
  }

  :deep(.el-select-v2__tags-text) {
    max-width: 120px !important;
  }

  :deep(.el-select__tags) {
    flex-wrap: nowrap;
  }

  :deep(.el-select-tags-wrapper.has-prefix) {
    padding-left: 24px;
    display: flex;
    flex-wrap: nowrap;
  }

  :deep(.el-tag) {
    height: 16px !important;
  }

  :deep(.el-select__tags-text) {
    max-width: 120px !important;
  }

  :deep(.el-input__suffix) {
    background: transparent;
  }
}

:deep(.el-select__input-wrapper) {
  flex: 1;
  overflow: hidden;
}

.select-list {
  .select-item {
    font-size: 12px;
    font-weight: 300;
    line-height: 24px;
    color: #656a85;
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;

    .select-item-text {
      display: inline-flex;
      width: 460px;
    }

    .select-item-delete-box {
      position: absolute;
      top: 3px;
      right: 4px;
      display: none;

      svg {
        width: 16px;
        height: 16px;
      }

      .select-item-delete-active {
        display: none;
      }

      &:hover {
        .select-item-delete {
          display: none;
        }

        .select-item-delete-active {
          display: block;
        }
      }
    }

    &:hover {
      background-color: #f7f8fc;
      color: #495ad4;

      .select-item-delete-box {
        display: block;
      }
    }
  }
}
</style>
