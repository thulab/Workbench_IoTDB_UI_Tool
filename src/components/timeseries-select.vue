<template>
  <div class="select-container" :data-testid="testIdPrefix ? `${testIdPrefix}-mode-wrapper` : undefined">
    <el-select v-model="searchFormData.selectType" class="custom-select deep-color-select" :style="{ width: locale === 'zh-cn' ? '90px' : '170px' }" :data-testid="testIdPrefix ? `${testIdPrefix}-mode-select` : undefined">
      <el-option value="name" :label="t('search.measurementName')" />
      <el-option value="desc" :label="t('search.measurementDescription')" />
    </el-select>
    <el-tooltip effect="light" :content="t('common.searchTipLimit100')" placement="top" popper-class="tooltip-box-width">
      <i-custom-question class="question-mark-overlay" />
    </el-tooltip>
  </div>
  <el-select
    :class="['remote-select-box', disabledSelect ? 'remote-select-disabled-box' : '']"
    v-model="model"
    :id="id"
    :data-testid="testIdPrefix ? `${testIdPrefix}-select` : undefined"
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
    <div class="select-controls" v-if="measurementList.length > 0" :data-testid="testIdPrefix ? `${testIdPrefix}-controls` : undefined">
      <el-button :type="isAllSelected ? 'primary' : 'default'" size="small" :disabled="disabledSelect" @click.stop="handleSelectAll" class="control-button" :data-testid="testIdPrefix ? `${testIdPrefix}-select-all` : undefined">
        {{ t('measurement.selectAll') }}
      </el-button>
      <el-button type="default" size="small" :disabled="disabledSelect" @click.stop="handleInvertSelection" class="control-button" :data-testid="testIdPrefix ? `${testIdPrefix}-invert-selection` : undefined">
        {{ t('measurement.invertSelection') }}
      </el-button>
    </div>
    <el-option
      v-for="item in measurementList"
      :key="item.timeseries"
      :label="item.timeseries"
      :value="item.timeseries"
      :id="`timeseries-select-${item.timeseries}`"
      :data-testid="testIdPrefix ? `${testIdPrefix}-option-${formatTimeseriesTestId(item.timeseries)}` : undefined"
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
  <el-button v-if="isShowViewBtn" type="primary" :disabled="!model.length" class="m-l-12" :data-testid="testIdPrefix ? `${testIdPrefix}-view-selected` : undefined" @click="() => (dialogVisible = true)">{{ t(viewText) }}</el-button>
  <el-dialog :title="t(viewText)" v-model="dialogVisible" class="select-modal" align-center width="520px" :data-testid="testIdPrefix ? `${testIdPrefix}-selected-dialog` : undefined">
    <el-scrollbar :max-height="400">
      <ul class="select-list" :data-testid="testIdPrefix ? `${testIdPrefix}-selected-list` : undefined">
        <li v-for="(item, index) in model" :key="item" class="select-item" :data-testid="testIdPrefix ? `${testIdPrefix}-selected-item-${formatTimeseriesTestId(item)}` : undefined">
          <span class="select-item-text"><text-tooltip :content="item" /></span>
          <div class="select-item-delete-box" :data-testid="testIdPrefix ? `${testIdPrefix}-selected-delete-${formatTimeseriesTestId(item)}` : undefined" @click="handleDelete(index)">
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
    testIdPrefix?: string;
  }>(),
  {
    isShowViewBtn: true,
    viewText: 'dataTrend.choosedMeasurement',
    showPrefix: true,
    selectWidth: 336,
    itemWidth: 284,
    isShowType: false,
  },
);

const { locale } = useI18n();

const computedPlaceholder = computed(() => {
  return props.placeholder || (searchFormData.selectType === 'desc' ? 'measurement.descriptionSelectPlaceholder' : 'measurement.measurementNameSelectPlaceholder');
});

const emit = defineEmits<{
  (event: 'update:modelValue', vals: string[]): void;
  (event: 'handleChangePath', vals: string[], data: MeasurementDataItem[]): void;
}>();

const { t } = useI18n();
const model = useVModel(props, 'modelValue');
const dialogVisible = ref(false);
const measurementList = ref<MeasurementDataItem[]>([]);

const searchFormData = reactive({
  selectType: 'name', // 新增字段，控制选择类型
});

const { requestFn: getMeasurement } = useRequest(StorageApi.getMeasurementAllObjList);

let lastMeasurementQuery = '';
const remoteMethod = debounce((query: string) => {
  lastMeasurementQuery = query;
  getMeasurement(lastMeasurementQuery, searchFormData.selectType === 'desc').then((res) => {
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

function formatTimeseriesTestId(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
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

.select-container {
  position: relative;
  display: inline-flex;
  height: 28px !important;
  margin-right: -1px;

  .question-mark-overlay {
    position: absolute;
    right: 22px;
    top: 30%;
    transform: translateY(-50%);
    color: #ccc;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.3s ease;
    z-index: 10;

    &:hover {
      color: #409eff;
    }
  }
}

:deep(.custom-select) {
  .el-select__wrapper {
    height: 20px;
    border: 1px solid #e4e7ed;
    background-color: #f0f1fa;
    box-shadow: none !important;
    border-radius: 1px 0 0 1px;

    &.is-focused {
      border-color: #e4e7ed !important;
      box-shadow: none !important;
    }
  }
}
</style>
