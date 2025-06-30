<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${t('common.add')}${addType === 'addTable' ? t('dataManage.table') : t('dataManage.column')}`"
    width="748px"
    :close-on-click-modal="false"
    id="table-modal-table-column"
  >
    <el-form ref="formRef" :model="formData" label-width="120px" label-position="left">
      <!-- 表名 -->
      <base-form-item :label="`${t('dataManage.tableName')}：`" prop="tableName" required :rules="tableNameRules">
        <template #label>
          {{ t('dataManage.tableName') }}：
          <el-tooltip effect="light" :content="t('dataManage.tableNameTip')" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
        </template>
        <el-input v-model="formData.tableName" :placeholder="t('dataManage.tableNamePlaceholder')" clearable :disabled="addType !== 'addTable'" />
      </base-form-item>

      <!-- 数据保留时间 -->
      <base-form-item :label="`${t('dataManage.ttl')}：`" prop="ttl">
        <template #label>
          {{ t('dataManage.ttl') }}：
          <el-tooltip effect="light" :content="t('dataManage.ttlTip')" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
        </template>
        <el-input v-model="formData.ttl" :placeholder="t('dataManage.ttlPlaceholder2')" clearable :disabled="addType !== 'addTable'" @input="handleNumberInput">
          <template #append>ms</template>
        </el-input>
      </base-form-item>

      <el-scrollbar :max-height="400" :min-height="152" class="measurement-list-box">
        <el-collapse accordion v-model="activeName">
          <el-collapse-item v-for="(item, index) in formData.columns" :key="index" :name="`measurement_${index}`">
            <template #title>
              <el-row class="collapse-title-box">
                <el-col :span="12">
                  <div class="all-path-name">{{ `${t('dataManage.columnName')}：${item.columnName}` }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="collapse-data-type-box">
                    <span class="data-type-label">{{ t('dataManage.dataType') }}</span>
                    <span>{{ item.dataType }}</span>
                  </div>
                </el-col>
                <el-col :span="4">
                  <div class="operate-box">
                    <el-button link :disabled="existEmpty" @click.stop="copyColumn(index)" :id="`measurement-modal-collapse-${index}-copy`" :class="existEmpty ? '' : 'svg-button-hover-color'">
                      <i-custom-copy />
                    </el-button>
                    <el-button link :class="['m-x-12', 'svg-button-hover-color']" @click.stop="deleteColumn(index)" :id="`measurement-modal-collapse-${index}-del`">
                      <i-custom-delete />
                    </el-button>
                  </div>
                </el-col>
              </el-row>
            </template>

            <base-form-item :label="`${t('dataManage.columnName')}：`" :prop="`columns[${index}].columnName`" required :rules="tableNameRules">
              <template #label>
                {{ t('dataManage.columnName') }}：
                <el-tooltip effect="light" :content="t('dataManage.tableNameTip')" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
              </template>
              <el-input v-model="item.columnName" :placeholder="t('dataManage.columnNamePlaceholder')" clearable />
            </base-form-item>

            <base-form-item :label="`${t('dataManage.comment')}：`">
              <el-input v-model="item.comment" :placeholder="t('dataManage.commentPlaceholder')" type="textarea" :rows="2" maxlength="100" show-word-limit clearable />
            </base-form-item>

            <el-row>
              <el-col :span="12">
                <base-form-item :label="`${t('dataManage.cateGory')}：`" required>
                  <el-select v-model="item.cateGory" :placeholder="t('dataManage.cateGoryPlaceholder')" @change="handleColumnTypeChange(index)">
                    <el-option v-for="item in columnTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </base-form-item>
              </el-col>
              <el-col :span="12">
                <base-form-item :label="`${t('dataManage.dataType')}：`" required>
                  <el-select v-model="item.dataType" :placeholder="t('dataManage.dataTypePlaceholder')" :disabled="['TAG', 'ATTRIBUTE'].includes(item.cateGory)">
                    <el-option v-for="item in dataTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </base-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-scrollbar>

      <!-- 添加列按钮 -->

      <el-button style="width: 100%" :class="['m-t-16', existEmpty ? '' : 'svg-button-hover-color']" :disabled="existEmpty || !canAddColumn" @click="addColumn" id="measurement-modal-collapse-add">
        <i-custom-add class="m-r-4" />
        {{ t('dataManage.addCloumn') }}({{ formData.columns.length }}/10)
      </el-button>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { ref, reactive, computed } from 'vue';
import { IoTDBApi } from '@/api';

const emit = defineEmits<{
  (event: 'handleReload'): void;
}>();

const { t } = useI18n();
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const { requestFn: saveTable } = useRequest(IoTDBApi.saveTable);
const { requestFn: saveColumns } = useRequest(IoTDBApi.saveColumns);
const addType = ref('addTable'); // addTable or addColumn
const activeName = ref('measurement_0');

const columnTypeOptions = [
  { label: 'TAG（标签列）', value: 'TAG' },
  { label: 'FIELD（测点列）', value: 'FIELD' },
  { label: 'ATTRIBUTE（属性列）', value: 'ATTRIBUTE' },
];

const dataTypeOptions = [
  { label: 'BOOLEAN', value: 'BOOLEAN' },
  { label: 'INT32', value: 'INT32' },
  { label: 'INT64', value: 'INT64' },
  { label: 'FLOAT', value: 'FLOAT' },
  { label: 'DOUBLE', value: 'DOUBLE' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'STRING', value: 'STRING' },
  { label: 'BLOB', value: 'BLOB' },
  { label: 'TIMESTAMP', value: 'TIMESTAMP' },
  { label: 'DATE', value: 'DATE' },
];

const formData = reactive<{
  tableName: string;
  ttl: string;
  ttlUnit: string;
  columns: Array<{
    columnName: string;
    comment: string;
    cateGory: string;
    dataType: string;
  }>;
}>({
  tableName: '',
  ttl: '',
  ttlUnit: 'ms',
  columns: [],
});
const formDataBody = ref<IoTDB.Database>({
  database: '',
  tables: [],
});
const currentNode = ref<IoTDB.TreeNodeData>();
const tableNames = computed(() => {
  if (currentNode?.value && currentNode.value.children?.length) {
    return currentNode.value.children.map((item) => item.nodeName);
  }
  return [];
});

const validateName = (rule: any, value: any, callback: any) => {
  if (value && tableNames.value.some((name) => name.toLocaleLowerCase() === value.toLocaleLowerCase())) {
    callback(new Error(t('dataManage.tableNameExist')));
  }

  // 情况1：简单名称（字母开头，可包含下划线和数字）
  const simplePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  // 情况2：需要引号包裹的名称（包含特殊字符、中文或以数字开头）
  const needsQuotesPattern = /^".*"$/;
  // 特殊字符正则（包括中文、数字开头和各种特殊符号）
  const specialCharsPattern = /[`~!@#$%^&*()+=|{}':;',[\]<>/?\\]|[\u4e00-\u9fa5]|^[0-9]/;
  if (simplePattern.test(value)) {
    callback();
  } else if (specialCharsPattern.test(value) && !needsQuotesPattern.test(value)) {
    // 包含特殊字符但未用引号包裹
    callback(new Error(t('dataManage.specialCharsNeedQuotes'))); // Add i18n key
  } else if (needsQuotesPattern.test(value)) {
    // 检查引号内是否为空
    const unquoted = value.slice(1, -1);
    if (unquoted === '') {
      callback(new Error(t('dataManage.emptyQuotedName'))); // Add i18n key
    } else {
      callback();
    }
  } else {
    // 其他非法格式
    callback(new Error(t('dataManage.invalidNameFormat'))); // Add i18n key
  }
};

const tableNameRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: 'blur',
  },
  {
    max: 64,
    message: () => t('dataManage.databaseNameLenth'),
    trigger: 'blur',
  },
  {
    validator: validateName,
    trigger: 'blur',
  },
]);

// 是否可以添加新列
const canAddColumn = computed(() => {
  return formData.columns.length < 10;
});

// 监听列类型变化
const handleColumnTypeChange = (index: number) => {
  if (['TAG', 'ATTRIBUTE'].includes(formData.columns[index].cateGory)) {
    formData.columns[index].dataType = 'STRING';
  }
};

const existEmpty = computed(() => {
  const flag = formData.columns.some((s) => !s.columnName || !s.dataType || !s.cateGory);
  return flag;
});

// 添加新列
const addColumn = () => {
  if (!canAddColumn.value) return;

  const newColumn = {
    columnName: '',
    comment: '',
    cateGory: 'FIELD',
    dataType: 'STRING',
  };

  formData.columns.push(newColumn);
  nextTick(() => {
    activeName.value = `measurement_${formData.columns.length - 1}`;
  });
};

// 复制列
const copyColumn = (index: number) => {
  if (!canAddColumn.value) return;

  const columnToCopy = formData.columns[index];
  const newColumn = {
    ...columnToCopy,
    columnName: `${columnToCopy.columnName}_copy`,
  };

  formData.columns.splice(index + 1, 0, newColumn);
  nextTick(() => {
    activeName.value = `measurement_${formData.columns.length - 1}`;
  });
  ElMessage.success('列已复制');
};

// 只允许输入数字
const handleNumberInput = (value: string) => {
  formData.ttl = value.replace(/[^\d]/g, '');
};

// 删除列
const deleteColumn = (index: number) => {
  ElMessageBox.confirm('是否删除该列？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      formData.columns.splice(index, 1);
      ElMessage.success('列已删除');
    })
    .catch(() => {});
};

// 确认提交
const handleConfirm = async () => {
  if (!formData.tableName.trim()) {
    ElMessage.warning('请输入表名');
    return;
  }

  if (formData.columns.length === 0) {
    ElMessage.warning('请至少添加一列');
    return;
  }

  // 检查所有列是否填写完整
  for (let i = 0; i < formData.columns.length; i++) {
    const column = formData.columns[i];
    if (!column.columnName.trim()) {
      ElMessage.warning(`请填写第 ${i + 1} 列的列名`);
      return;
    }
    if (!column.cateGory) {
      ElMessage.warning(`请选择第 ${i + 1} 列的列类别`);
      return;
    }
    if (!column.dataType) {
      ElMessage.warning(`请选择第 ${i + 1} 列的数据类型`);
      return;
    }
  }

  let validate = false;
  await formRef.value?.validate((valid) => {
    validate = valid;
  });
  if (!validate) return;

  formDataBody.value.database = addType.value === 'addTable' ? currentNode.value?.nodeName || '' : currentNode.value?.parentName || '';
  formDataBody.value.tables.push({
    tableVO: {
      tableName: formData.tableName,
      ttl: formData.ttl,
      ttlUnit: formData.ttlUnit,
    },
    columnVOS: formData.columns.map((column) => ({
      columnName: column.columnName,
      comment: column.comment,
      cateGory: column.cateGory,
      dataType: column.dataType,
    })),
  });
  if (addType.value === 'addTable') {
    saveTable(formDataBody.value).then(() => {
      ElMessage.success('表创建成功');
      dialogVisible.value = false;
      emit('handleReload');
    });
  } else {
    saveColumns(formDataBody.value).then(() => {
      ElMessage.success('添加成功');
      dialogVisible.value = false;
      emit('handleReload');
    });
  }
};

function resetFormData() {
  formData.tableName = '';
  formData.ttl = '';
  formData.columns = [];
}

// 暴露方法供父组件调用
defineExpose({
  open: (currentVal: IoTDB.TreeNodeData, typeVal: string = 'addTable') => {
    resetFormData();
    currentNode.value = currentVal;
    addType.value = typeVal;
    if (currentVal) {
      formData.ttl = currentVal.ttl || '';
    }
    if (addType.value !== 'addTable') {
      formData.tableName = currentVal.nodeName;
    }
    dialogVisible.value = true;
  },
  close: () => {
    dialogVisible.value = false;
  },
});
</script>
<style lang="scss" scoped>
.measurement-list-box {
  border-bottom: none;

  :deep(.el-form-item--default) {
    margin-right: 9px;
  }

  :deep(.el-form-item__label) {
    padding-right: 4px;
  }
}

.collapse-title-box {
  height: 100%;
  width: calc(100% - 40px);

  .all-path-name {
    font-size: 14px;
    font-weight: 400;
    color: #424561;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    height: 100%;
    text-align: left;
  }
}

.measurement-operate {
  margin: 0 16px 0 24px;
}

.collapse-data-type-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #424561;

  .data-type-label {
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #656a85;
    margin-bottom: 2px;
  }
}

.operate-box {
  text-align: right;

  .el-button {
    min-width: 28px !important;
    padding: 0 !important;
  }
}
</style>
