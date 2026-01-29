<template>
  <el-select
    :class="['remote-select-box', disabledSelect ? 'remote-select-disabled-box' : '']"
    v-model="model"
    :id="id"
    :placeholder="t(computedPlaceholder)"
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
    popper-class="overflow-popper"
    :popper-style="`width: ${itemWidth}px !important;`"
    @change="handleChangePath"
  >
    <template #prefix v-if="showPrefix">
      <el-icon class="remote-select-search-icon" size="20"><i-custom-search-icon /></el-icon>
    </template>
    <!-- Select All / Invert Selection Controls -->
    <div class="select-controls" v-if="measurementList.length > 0">
      <el-button :type="isAllSelected ? 'primary' : 'default'" size="small" :disabled="disabledSelect" @click.stop="handleSelectAll" class="control-button">
        {{ t('measurement.selectAll') }}
      </el-button>
      <el-button type="default" size="small" :disabled="disabledSelect" @click.stop="handleInvertSelection" class="control-button">
        {{ t('measurement.invertSelection') }}
      </el-button>
    </div>
    <el-option
      v-for="item in measurementList"
      :key="item.timeseries"
      :label="item.timeseries"
      :value="item.timeseries"
      :id="`timeseries-select-${item.timeseries}`"
      :disabled="disabledPath ? disabledPath(item) : false"
    >
      <div class="timeseries-option-box">
        <template v-if="isShowType">
          <i-custom-type-boolean v-if="item.dataType === 'BOOLEAN'" class="timeseries-type-text" />
          <i-custom-type-double v-else-if="item.dataType === 'DOUBLE'" class="timeseries-type-text" />
          <i-custom-type-float v-else-if="item.dataType === 'FLOAT'" class="timeseries-type-text" />
          <i-custom-type-int32 v-else-if="item.dataType === 'INT32'" class="timeseries-type-text" />
          <i-custom-type-int64 v-else-if="item.dataType === 'INT64'" class="timeseries-type-text" />
          <i-custom-type-text v-else-if="item.dataType === 'TEXT'" class="timeseries-type-text" />
        </template>
        <div :style="`display: flex; width: ${isShowType ? 'calc(100% - 68px)' : '100%'}`">
          <text-tooltip :content="item.timeseries" />
        </div>
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
import type { MeasurementDataItem } from '@/types';

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
    disabledPath?: (data: MeasurementDataItem) => boolean;
    selectWidth?: number;
    itemWidth?: number;
    isShowType?: boolean;
    isByDesc?: boolean;
  }>(),
  {
    isShowViewBtn: true,
    viewText: 'dataTrend.choosedMeasurement',
    showPrefix: true,
    selectWidth: 336,
    itemWidth: 284,
    isShowType: false,
    isByDesc: true,
  },
);

const computedPlaceholder = computed(() => {
  return props.placeholder || (props.isByDesc ? 'measurement.descriptionSelectPlaceholder' : 'measurement.measurementNameSelectPlaceholder');
});

const emit = defineEmits<{
  (event: 'update:modelValue', vals: string[]): void;
  (event: 'handleChangePath', vals: string[], data: MeasurementDataItem[]): void;
}>();

const { t } = useI18n();
const model = useVModel(props, 'modelValue');
const dialogVisible = ref(false);
const measurementList = ref<MeasurementDataItem[]>([]);

const { requestFn: getMeasurement } = useRequest(StorageApi.getMeasurementAllObjList);

let lastMeasurementQuery = '';
const remoteMethod = debounce((query: string) => {
  lastMeasurementQuery = query;
  getMeasurement(lastMeasurementQuery, props.isByDesc).then((res) => {
    if (lastMeasurementQuery === query) {
      let measurements = res.data?.measurements || [];
      if (props.filterSystem) {
        measurements = measurements.filter((item) => !item.timeseries.startsWith('root.__system.'));
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

// Get enabled options (not disabled by disabledPath)
const enabledOptions = computed(() => {
  return measurementList.value.filter((item) => !props.disabledPath || !props.disabledPath(item)).map((item) => item.timeseries);
});

const isAllSelected = computed(() => {
  const options = enabledOptions.value;
  if (!options.length) return false;
  const selectedSet = new Set(model.value);
  return options.every((item) => selectedSet.has(item));
});

function handleSelectAll() {
  if (isAllSelected.value) {
    model.value = [];
  } else {
    model.value = [...enabledOptions.value];
  }
  handleChangePath(model.value);
}

function handleInvertSelection() {
  const selectedSet = new Set(model.value);
  const newSelection = enabledOptions.value.filter((item) => !selectedSet.has(item));
  model.value = newSelection;
  handleChangePath(model.value);
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

  &.remote-select-disabled-box {
    :deep(.el-select__tags-text) {
      max-width: 100% !important;
    }
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

.timeseries-option-box {
  display: flex;
  align-items: center;
  width: 100%;

  .timeseries-type-text {
    flex: 0 0 58px;
    height: 18px;
    margin-right: 10px;
  }
}

.select-controls {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #ebedf0;
  gap: 8px;

  .control-button {
    font-size: 12px;
    padding: 0 8px;
    height: 28px;
    line-height: 28px;

    &:disabled {
      color: #b8c1d6;
      cursor: not-allowed;
    }
  }

  :deep(.el-divider--vertical) {
    height: 16px;
    margin: 0 4px;
    background-color: #ebedf0;
  }
}
</style>
