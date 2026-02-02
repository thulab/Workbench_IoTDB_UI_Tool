<!-- 表模型测点选择弹窗 -->
<template>
  <el-dialog v-model="dialogVisible" :title="t('measurement.measurementChoose')" width="630px" :before-close="handleClose" :close-on-click-modal="false" :close-on-press-escape="false" draggable>
    <div class="modal-table-measurement-container flex gap-1">
      <!-- 左侧测点选择区域 -->
      <div class="flex-2 flex flex-col">
        <el-form :model="formData" :rules="formRules" ref="formRef" label-position="left">
          <!-- 标签键值对输入 -->
          <el-form-item :label="`${t('measurement.device')}：`" required props="selectedTags" class="device-form-item">
            <div class="device-filter-container">
              <div class="device-filter-inputs">
                <el-scrollbar max-height="80" class="device-filter-scroll">
                  <div v-for="(tag, index) in tagFilters" :key="index" class="device-filter-row flex flex-1 items-center">
                    <el-select v-model="tag.variable" :disabled="!availableTags.length" :placeholder="t('common.selectPlaceholder')" class="flex-shrink-0 w-[140px]">
                      <el-option
                        v-for="option in availableTags"
                        :disabled="!canChoice(option, index)"
                        :key="option.nodeName"
                        :label="option.nodeName + (option.comment ? ` (${option.comment})` : '')"
                        :value="option.nodeName!"
                      />
                    </el-select>
                    <span class="m-x-[8px]">：</span>
                    <el-input v-model="tag.value" class="flex-1" :disabled="!availableTags.length" :placeholder="t('tableMeasurement.devicePlaceholder')" />
                  </div>
                </el-scrollbar>
              </div>
              <div class="device-filter-actions">
                <el-button type="primary" link :disabled="tagFilters.length <= 1" @click="removeTagFilter(tagFilters.length - 1)">
                  <el-icon size="24">
                    <i-custom-tags-del />
                  </el-icon>
                </el-button>
                <el-button type="primary" link :disabled="tagFilters.length >= availableTags.length" @click="addTagFilter">
                  <el-icon size="24">
                    <i-custom-tags-add />
                  </el-icon>
                </el-button>
                <el-button type="primary" link @click="searchDevices">
                  <el-icon size="24">
                    <i-custom-tags-query />
                  </el-icon>
                </el-button>
              </div>
            </div>
            <!-- 第三行：设备表格 -->
            <el-table
              border
              ref="deviceTableRef"
              class="device-table m-t-[8px]"
              :data="deviceTableData"
              style="width: 100%"
              :height="260"
              :max-height="260"
              v-loading="searchLoading"
              tooltip-effect="light"
              :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
              @selection-change="handleDeviceSelection"
              @scroll="handleScroll"
            >
              <el-table-column fixed="left" type="selection" width="50" v-if="deviceColumns.length" max-width="50" align="center" />
              <el-table-column
                :key="item.prop"
                :prop="item.prop"
                v-for="item of deviceColumns"
                min-width="180px"
                :width="`${item.width}px`"
                :align="item.align"
                :fixed="item.fixed"
                :sortable="item.sortable"
                :sort-orders="['ascending', 'descending']"
                show-overflow-tooltip
              >
                <template #header>
                  <span :class="item.sortable ? '' : 'flex-header'"><text-tooltip :content="item.label" /></span>
                </template>
                <template #default="scope">
                  <span>{{ scope.row[item.prop] ? scope.row[item.prop] : '-' }}</span>
                </template>
              </el-table-column>
              <slot name="append-column"></slot>
              <template #empty>
                <div class="table-empty-wrapper">
                  <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
                  <span class="data-empty-text">{{ t('common.noData') }}</span>
                </div>
              </template>
            </el-table>
          </el-form-item>

          <!-- 第四行：测点选择 -->
          <el-form-item prop="selectedMeasurement" class="m-t-[8px]" :label="`${t('measurement.measurement')}：`">
            <el-select
              v-model="formData.selectedMeasurement"
              :placeholder="t('aiAnalysis.chooseMeasurement')"
              :disabled="!currentTableInfo || availableMeasurements.length === 0"
              filterable
              multiple
              :collapse-tags="true"
              :multiple-limit="props.selectedLimit"
              class="search-select w-full"
            >
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" />
              </template>
              <el-option
                v-for="measurement in availableMeasurements"
                :key="measurement.nodeName"
                :disabled="!props.supportedTypes.includes(measurement.datatype || '')"
                :label="measurement.nodeName + (measurement.comment ? ` (${measurement.comment})` : '')"
                :value="measurement.nodeName!"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <el-button @click="handleClear">{{ t('common.clear') }}</el-button>
        <el-button @click="handleClose">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="!canAdd">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useDbStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { TableDataApi } from '@/api';
import type { FormInstance, TableInstance, FormRules } from 'element-plus';

import type { TableTreeNodeData, SelectedMeasurement, TagFilter } from '@/types';

const props = withDefaults(
  defineProps<{
    currentDatabase?: string;
    currentTable?: string;
    selectedMeasurements?: SelectedMeasurement[];
    selectedLimit?: number;
    supportedTypes?: string[];
  }>(),
  {
    selectedLimit: 10,
    supportedTypes: () => ['INT32', 'INT64', 'FLOAT', 'DOUBLE'],
  },
);

const emit = defineEmits<{
  confirm: [measurements: SelectedMeasurement[]];
  close: [];
}>();

// 使用 defineModel 简化双向绑定
const dialogVisible = defineModel<boolean>('visible');

const { treeData } = storeToRefs(useDbStore());
const { getDatabases } = useDbStore();
const { t } = useI18n();

// 表单引用
const formRef = ref<FormInstance>();
const deviceTableRef = ref<TableInstance>();

// 响应式数据
const formData = reactive({
  selectedDatabase: '',
  selectedTable: '',
  selectedTags: '',
  selectedMeasurement: [] as string[], // 支持多选测点
  selectedMeasurementType: [] as string[], // 支持多选测点类型
});
const tagFilters = ref<TagFilter[]>([{ variable: '', value: '' }]);
const deviceTableData = ref<Record<string, string>[]>([]);
const selectedDevices = ref<Record<string, string>[]>([]);
const internalSelectedMeasurements = ref<SelectedMeasurement[]>([]);

const { requestFn: getDevices, loading: searchLoading } = useRequest(TableDataApi.getDevices);

const currentPage = ref(1);
const noMoreData = ref(true);

const currentTableInfo = computed(() => {
  if (props.currentDatabase && props.currentTable) {
    const db = treeData.value.find((d) => d.nodeName === props.currentDatabase);
    return db?.children?.find((table) => table.nodeName === props.currentTable && table.nodeType === 'TABLE');
  }
  return null;
});

const availableTags = computed(() => {
  if (!currentTableInfo.value) return [];
  return currentTableInfo.value.children?.filter((col) => col.nodeType === 'TAG') || [];
});

const availableMeasurements = computed(() => {
  if (!currentTableInfo.value) return [];

  return currentTableInfo.value.children?.filter((col) => col.nodeType === 'FIELD') || [];
});

const canAdd = computed(() => {
  return (
    formData.selectedDatabase && // 数据库已选择
    formData.selectedTable && // 表已选择
    (selectedDevices.value.length > 0 || availableTags.value.length === 0) && // 有设备的情况下设备已选择
    formData.selectedMeasurement && // 测点已选择
    formData.selectedMeasurement.length > 0
  );
});

// 表单验证规则
const formRules = reactive<FormRules>({
  selectedDatabase: [{ required: true, message: t('common.formRuleEmptyOperateShort'), trigger: 'change' }],
  selectedTable: [{ required: true, message: t('common.formRuleEmptyOperateShort'), trigger: 'change' }],
  selectedMeasurement: [{ required: true, message: t('common.formRuleEmptyOperateShort'), trigger: 'change' }],
  selectedTags: [
    {
      validator: (rule, value, callback) => {
        const validTags = tagFilters.value.filter((tag) => tag.variable && tag.value);
        if (availableTags.value.length !== 0 && validTags.length === 0) {
          callback(new Error(t('common.formRuleEmptyOperateShort')));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
});

// 设备表格列配置
const deviceColumns = computed<globalThis.DynamicTableColumn[]>(() => {
  return availableTags.value.map((tag) => ({
    prop: tag.nodeName,
    label: tag.nodeName + (tag.comment ? ` (${tag.comment})` : ''),
    width: 150,
  }));
});

// 方法
const handleClose = () => {
  dialogVisible.value = false;
  emit('close');
};

const initModal = async () => {
  await getDatabases();

  if (props.currentDatabase && props.currentTable) {
    formData.selectedDatabase = props.currentDatabase;
    formData.selectedTable = props.currentTable;
  }

  // 重置状态
  tagFilters.value = [{ variable: '', value: '' }];
  deviceTableData.value = [];
  selectedDevices.value = [];
  formData.selectedMeasurement = [];

  // 清除表单验证
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const canChoice = (option: TableTreeNodeData, index: number) => {
  // 获取除了当前 index 外的其他选项项的 key
  const keys = tagFilters.value.map((tag, i) => (i !== index ? tag.variable : '')).filter((key) => key);
  return keys.indexOf(option.nodeName) === -1;
};

const addTagFilter = () => {
  if (tagFilters.value.length >= availableTags.value.length) return;
  const unSelectedTags = availableTags.value.filter((tag) => !tagFilters.value.some((f) => f.variable === tag.nodeName));
  tagFilters.value.push({ variable: unSelectedTags[0]!.nodeName, value: '' });
};

const removeTagFilter = (index: number) => {
  if (tagFilters.value.length > 1) {
    tagFilters.value.splice(index, 1);
  }
};

const loadDevice = async (page: number = 1) => {
  await getDevices(
    {
      database: props.currentDatabase!,
      tableName: props.currentTable!,
      conditions: tagFilters.value.reduce(
        (acc, tag) => {
          if (tag.variable && tag.value) {
            acc.push({ variable: tag.variable, value: tag.value });
          }
          return acc;
        },
        [] as { variable: string; value: string }[],
      ),
    },
    page,
    10, // 可以根据需要调整分页大小
  ).then((res) => {
    const data = res.data.valueList.map((device) => {
      const item: Record<string, string> = {};
      res.data.metaDataList.forEach((col, index) => {
        item[col as unknown as string] = device[index] || '';
      });
      return item;
    });
    if (data.length === 0) {
      noMoreData.value = true;
    }
    if (page === 1) {
      currentPage.value = 1;
      deviceTableData.value = data;
    } else {
      currentPage.value = page;
      deviceTableData.value.push(...data);
    }
  });
};

const searchDevices = async () => {
  noMoreData.value = false;
  await loadDevice(1);
};

const handleDeviceSelection = (devices: Record<string, string>[]) => {
  selectedDevices.value = devices;
};

const addMeasurements = async () => {
  if (!canAdd.value) return;
  const newMeasurements: SelectedMeasurement[] = [];

  if (selectedDevices.value.length === 0 && availableTags.value.length === 0) {
    // 无标签，无设备，添加所有设备
    selectedDevices.value.push({});
  }

  selectedDevices.value.forEach((device) => {
    const condition = Object.keys(device)
      .map((key) => {
        if (device[key]) {
          return `"${key}"='${device[key]}'`;
        }
        return `"${key}"=null`;
      })
      .join(' AND ');
    formData.selectedMeasurement.forEach((measurement) => {
      const key = `${formData.selectedDatabase}-${formData.selectedTable}-${condition}-${measurement}`;
      const exists = internalSelectedMeasurements.value.some((m) => `${m.database}-${m.tableName}-${m.condition}-${m.measurement}` === key);
      const measurementType = availableMeasurements.value.find((m) => m.nodeName === measurement)?.datatype || '';
      if (!exists) {
        newMeasurements.push({
          database: formData.selectedDatabase,
          tableName: formData.selectedTable,
          condition,
          device: Object.keys(device).map((key) => ({ variable: key, value: device[key] })),
          measurement,
          measurementType,
        });
      }
    });
  });

  internalSelectedMeasurements.value.push(...newMeasurements);
  ElMessage.success(t('tableMeasurement.addSuccess', { count: newMeasurements.length }));
};

const removeMeasurement = (index: number) => {
  internalSelectedMeasurements.value.splice(index, 1);
};

const clearMeasurements = () => {
  internalSelectedMeasurements.value = [];
};

defineExpose({
  removeMeasurement,
  clearMeasurements,
});

const handleClear = () => {
  formRef.value?.resetFields();
  internalSelectedMeasurements.value = [];
  formData.selectedMeasurement = [];
  selectedDevices.value = [];
  tagFilters.value = [{ variable: '', value: '' }];
  deviceTableData.value = [];
  noMoreData.value = false;
  currentPage.value = 1;
};

const handleConfirm = () => {
  addMeasurements();
  emit('confirm', internalSelectedMeasurements.value);
  handleClose();
};

const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
  if (!deviceTableRef.value) return;
  if (noMoreData.value) return; // 如果没有更多数据，则不加载
  if ((deviceTableRef.value.$refs.tableBody as HTMLElement).offsetHeight <= scrollTop + 300) {
    loadDevice(currentPage.value + 1);
  }
};

// 监听props变化
watch(
  dialogVisible,
  async (val) => {
    if (!val) return;

    // initModal 内部会异步拉取数据库/树数据；这里必须等待完成后再读取 availableTags
    await initModal();
    await nextTick();

    if (availableTags.value.length === 0) {
      tagFilters.value = [{ variable: '', value: '' }];
    } else {
      tagFilters.value = [{ variable: availableTags.value[0]!.nodeName, value: '' }];
    }
    await searchDevices();
  },
  { immediate: true },
);

watch(
  () => props.selectedMeasurements,
  (val) => {
    if (val) {
      internalSelectedMeasurements.value = [...val];
    }
  },
  { immediate: true, deep: true },
);
</script>

<style lang="scss">
.device-table th.el-table__cell {
  font-weight: 700 !important;
}

.modal-table-measurement-container {
  justify-content: space-evenly;

  .device-form-item {
    .el-form-item__content {
      display: flex;
      align-items: center;
    }
  }

  .device-filter-container {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .device-filter-inputs {
    flex: 1;
  }

  .device-filter-scroll {
    width: 100%;
    max-height: 80px;
    overflow-x: hidden;
  }

  .device-filter-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .device-filter-row:last-child {
    margin-bottom: 0;
  }

  .device-filter-actions {
    display: flex;
    align-items: center;
    margin-left: 12px;
    gap: 4px;
  }

  .device-filter-actions .el-button {
    padding: 0;
  }

  .el-table--border .el-table__cell {
    border-right: 0;
  }

  .el-table__header-wrapper thead tr th {
    background-color: #f0f2f7;
    font-weight: 500;
  }

  .right-panel {
    padding: 8px 16px;
  }

  .selected-tip {
    font-size: 12px;
    line-height: 12px;
    color: #656a85;
    font-weight: 300;

    span {
      color: var(--el-color-primary);
    }
  }

  .selected-measurement-item {
    height: 24px;

    &:hover {
      color: var(--el-color-primary);
    }
  }
}
</style>
