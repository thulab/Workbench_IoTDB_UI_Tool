<!-- 表模型测点选择弹窗 -->
<template>
  <el-dialog v-model="dialogVisible" :title="t('measurement.measurementChoose')" width="630px" :before-close="handleClose" :close-on-click-modal="false" :close-on-press-escape="false" draggable>
    <div class="modal-table-measurement-container flex gap-1">
      <!-- 左侧测点选择区域 -->
      <div class="flex-2 flex flex-col">
        <el-form :model="formData" :rules="formRules" ref="formRef" label-position="left" label-width="80px">
          <!-- 第一行：数据库和表选择 -->
          <div class="flex gap-2" :style="{ marginBottom: firstRowHasWarning ? '8px' : '' }">
            <el-form-item ref="databaseItemRef" :label="`${t('measurement.databaseTitle')}：`" prop="selectedDatabase" class="flex-[10]">
              <el-select v-model="formData.selectedDatabase" filterable :placeholder="t('aiAnalysis.databasePlaceholeder')" @change="handleDatabaseChange" clearable class="search-select w-full">
                <template #prefix>
                  <i-custom-search-icon class="remote-select-search-icon" />
                </template>
                <el-option v-for="db in databaseOptions" :key="db.value" :label="db.label" :value="db.value" />
              </el-select>
            </el-form-item>
            <el-form-item ref="tableItemRef" :label="`${t('dataManage.table')}：`" label-width="40px" prop="selectedTable" class="flex-[8]">
              <el-select
                v-model="formData.selectedTable"
                filterable
                :placeholder="t('aiAnalysis.tablePlaceholder')"
                @change="handleTableChange"
                :disabled="!formData.selectedDatabase || tableOptions.length === 0"
                clearable
                class="search-select w-full"
              >
                <template #prefix>
                  <i-custom-search-icon class="remote-select-search-icon" />
                </template>
                <el-option v-for="table in tableOptions" :key="table.value" :label="table.label" :value="table.value" />
              </el-select>
            </el-form-item>
          </div>

          <!-- 第二行：标签键值对输入 -->
          <el-form-item :label="`${t('measurement.device')}：`" required props="selectedTags">
            <div class="flex flex-col gap-2">
              <div v-for="(tag, index) in tagFilters" :key="index" class="flex items-center">
                <el-select v-model="tag.variable" :disabled="!availableTags.length" :placeholder="t('common.selectPlaceholder')" class="w-[140px]">
                  <el-option
                    v-for="option in availableTags"
                    :disabled="!canChoice(option, index)"
                    :key="option.nodeName"
                    :label="option.nodeName + (option.comment ? ` (${option.comment})` : '')"
                    :value="option.nodeName!"
                  />
                </el-select>

                <span class="m-x-[8px]">：</span>
                <el-input v-model="tag.value" class="m-r-[12px] w-[240px]" :disabled="!availableTags.length" :placeholder="t('tableMeasurement.devicePlaceholder')" />
                <el-button type="primary" link :disabled="tagFilters.length <= 1" @click="removeTagFilter(index)">
                  <el-icon size="28">
                    <i-custom-tags-del />
                  </el-icon>
                </el-button>
                <el-button type="primary" link :disabled="tagFilters.length >= availableTags.length" @click="addTagFilter">
                  <el-icon size="28">
                    <i-custom-tags-add />
                  </el-icon>
                </el-button>

                <el-button type="primary" link @click="searchDevices" v-if="index === tagFilters.length - 1">
                  <el-icon size="28">
                    <i-custom-tags-query />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </el-form-item>

          <!-- 第三行：设备表格 -->
          <el-table
            ref="deviceTableRef"
            highlight-current-row
            border
            row-key="id"
            :data="tableData"
            style="max-width: 533px; margin-left: 80px"
            :height="260"
            :max-height="260"
            v-loading="searchLoading"
            tooltip-effect="light"
            :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
            @scroll="handleScroll"
            @current-change="handleSingleDeviceSelected"
          >
            <el-table-column width="40px">
              <template #default="{ row }">
                <el-checkbox :model-value="row.id === currentRowKey" @change="handleCheckboxChange(row)"></el-checkbox>
              </template>
            </el-table-column>
            <!-- <el-table-column fixed="left" type="selection" width="50" v-if="deviceColumns.length" max-width="50" align="center" /> -->
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
              class="w-[533px]"
            >
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

interface TableRow extends Record<string, string> {
  id: string;
  [key: string]: any;
}

const props = withDefaults(
  defineProps<{
    currentDatabase?: string;
    currentTable?: string;
    selectedMeasurements?: SelectedMeasurement[];
    selectedLimit?: number;
    supportedTypes?: string[];
  }>(),
  {
    selectedLimit: 1,
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
const databaseItemRef = ref(); // 数据库表单项引用
const tableItemRef = ref(); // 新增表单项引用
const currentRowKey = ref<string | number | null>(null);
const ignoreKeys = new Set(['id']);

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
const tableData = computed(() =>
  deviceTableData.value.map(
    (row, index) =>
      ({
        ...row,
        id: index.toString(), // 给每行数据添加唯一的 id 属性
      }) as TableRow,
  ),
);
const singleSelectedDevice = ref<Record<string, string> | null>(null);
const internalSelectedMeasurements = ref<SelectedMeasurement[]>([]);

const { requestFn: getDevices, loading: searchLoading } = useRequest(TableDataApi.getDevices);

const currentPage = ref(1);
const noMoreData = ref(true);
// 计算属性
const databaseOptions = computed(() => {
  return treeData.value
    .filter((db) => db.nodeName !== 'information_schema')
    .map((db) => ({
      value: db.nodeName,
      label: db.nodeName,
    }));
});

const firstRowHasWarning = computed(() => {
  return tableItemRef.value?.validateState === 'error' || databaseItemRef.value?.validateState === 'error';
});

const tableOptions = computed(() => {
  if (!formData.selectedDatabase) return [];

  const db = treeData.value.find((d) => d.nodeName === formData.selectedDatabase);
  return (
    db?.children
      ?.filter((table) => table.nodeType === 'TABLE')
      .map((table) => ({
        value: table.nodeName,
        label: table.nodeName + (table.comment ? ` (${table.comment})` : ''),
      })) || []
  );
});

const currentTableInfo = computed(() => {
  if (formData.selectedDatabase && formData.selectedTable) {
    const db = treeData.value.find((d) => d.nodeName === formData.selectedDatabase);
    return db?.children?.find((table) => table.nodeName === formData.selectedTable && table.nodeType === 'TABLE');
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
  return formData.selectedDatabase && formData.selectedTable && singleSelectedDevice.value && formData.selectedMeasurement && formData.selectedMeasurement.length > 0;
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
const handleSingleDeviceSelected = (currentRow: Record<string, string>) => {
  singleSelectedDevice.value = currentRow;
  currentRowKey.value = currentRow.id ?? null;
};

const handleCheckboxChange = (row: Record<string, string>) => {
  currentRowKey.value = row.id ?? null;
  singleSelectedDevice.value = row;
  deviceTableRef.value?.setCurrentRow(row);
};

const handleClose = () => {
  dialogVisible.value = false;
  emit('close');
};

const initModal = async () => {
  await getDatabases();
  deviceTableData.value = [];

  if (props.currentDatabase && props.currentTable) {
    formData.selectedDatabase = props.currentDatabase;
    formData.selectedTable = props.currentTable;
  }
  if (availableTags.value.length === 0) {
    tagFilters.value = [{ variable: '', value: '' }];
  } else {
    tagFilters.value = [{ variable: availableTags.value[0]!.nodeName, value: '' }];
  }
  await searchDevices();
  if (props.selectedMeasurements && props.selectedMeasurements.length > 0) {
    internalSelectedMeasurements.value = [...props.selectedMeasurements];
    formData.selectedMeasurement = props.selectedMeasurements.map((m) => m.measurement);
    const selectedDevice = props.selectedMeasurements[0]?.device;
    for (const row of tableData.value) {
      let match = true;
      if (selectedDevice) {
        for (const tag of selectedDevice) {
          if (row[tag.variable] !== tag.value) {
            match = false;
            break;
          }
        }
      }
      if (match) {
        singleSelectedDevice.value = row;
        break;
      }
    }
  } else {
    internalSelectedMeasurements.value = [];
    formData.selectedMeasurement = [];
  }

  // 清除表单验证
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const handleDatabaseChange = () => {
  // 清空表选择和相关状态
  formData.selectedTable = '';
  deviceTableData.value = [];
  singleSelectedDevice.value = null;
  formData.selectedMeasurement = [];
};

const handleTableChange = () => {
  // 清空相关状态
  deviceTableData.value = [];
  singleSelectedDevice.value = null;
  if (availableTags.value.length === 0) {
    tagFilters.value = [{ variable: '', value: '' }];
  } else {
    tagFilters.value = [{ variable: availableTags.value[0]!.nodeName, value: '' }];
  }

  searchDevices();
  formData.selectedMeasurement = [];
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
      database: formData.selectedDatabase,
      tableName: formData.selectedTable,
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
    100, // 可以根据需要调整分页大小
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
  // 先验证表单
  const isValid = await formRef.value?.validateField(['selectedDatabase', 'selectedTable', 'selectedTags']).catch(() => false);
  if (!isValid) {
    return;
  }
  noMoreData.value = false;
  await loadDevice(1);
};

const handleClear = () => {
  formRef.value?.resetFields();
  internalSelectedMeasurements.value = [];
  formData.selectedMeasurement = [];
  singleSelectedDevice.value = null;
  tagFilters.value = [{ variable: '', value: '' }];
  deviceTableData.value = [];
  noMoreData.value = false;
  currentPage.value = 1;
};

const handleConfirm = () => {
  internalSelectedMeasurements.value = [];
  internalSelectedMeasurements.value.push({
    database: formData.selectedDatabase,
    tableName: formData.selectedTable,
    condition: singleSelectedDevice.value
      ? Object.keys(singleSelectedDevice.value)
          .filter((key) => !ignoreKeys.has(key))
          .map((key) => {
            if (singleSelectedDevice.value![key]) {
              return `"${key}"='${singleSelectedDevice.value![key]}'`;
            }
            return `"${key}"=null`;
          })
          .join(' AND ')
      : '',
    device: singleSelectedDevice.value
      ? Object.keys(singleSelectedDevice.value)
          .filter((key) => !ignoreKeys.has(key))
          .map((key) => ({
            variable: key,
            value: singleSelectedDevice.value![key],
          }))
      : [],
    measurement: formData.selectedMeasurement[0] || '',
    measurementType: availableMeasurements.value.find((m) => m.nodeName === formData.selectedMeasurement[0])?.datatype || '',
  });
  emit('confirm', internalSelectedMeasurements.value);
  ElMessage.success(t('tableMeasurement.addSuccess', { count: internalSelectedMeasurements.value.length }));
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
    if (val) {
      await initModal();
      if (singleSelectedDevice.value) {
        deviceTableRef.value?.setCurrentRow(singleSelectedDevice.value);
        currentRowKey.value = singleSelectedDevice.value.id ?? null;
      }
    }
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
.modal-table-measurement-container {
  // height: 450px;
  // min-height: 450px;

  .el-table--border .el-table__cell {
    border-right: 0;
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
