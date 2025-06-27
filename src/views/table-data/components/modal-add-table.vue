<template>
  <el-dialog v-model="dialogVisible" title="新增表" width="700px" :before-close="handleClose">
    <el-form ref="formRef" :model="formData" label-width="120px" label-position="left">
      <!-- 表名 -->
      <base-form-item label="表名：" prop="tableName" required>
        <template #label>
          {{ t('dataManage.tableName') }}：
          <el-tooltip effect="light" :content="t('dataManage.databaseNameTip')" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
        </template>
        <el-input v-model="formData.tableName" placeholder="请输入表名" clearable />
      </base-form-item>

      <!-- 数据保留时间 -->
      <base-form-item label="数据保留时间：" prop="ttl">
        <template #label>
          {{ t('dataManage.ttl') }}：
          <el-tooltip effect="light" content="表的 TTL 默认为其所在数据库的 TTL" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
        </template>
        <el-input v-model="formData.ttl" placeholder="请输入数据保留时间" clearable>
          <template #append>ms</template>
        </el-input>
      </base-form-item>

      <el-divider />

      <!-- 列列表 -->
      <div class="column-list">
        <div v-for="(column, index) in formData.columns" :key="index" class="column-item" :class="{ expanded: expandedIndex === index }">
          <div class="column-header" @click="toggleExpand(index)">
            <div class="column-title">
              <span>列{{ index + 1 }}: {{ column.columnName }}</span>
              <span class="column-type">{{ column.cateGory }}</span>
            </div>
            <div class="column-actions">
              <el-tooltip content="复制" placement="top">
                <el-icon size="24" class="svg-button-hover-color copy-icon" @click.stop="copyColumn(index)">
                  <i-custom-copy />
                </el-icon>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-icon size="24" class="svg-button-hover-color copy-icon" @click.stop="deleteColumn(index)">
                  <i-custom-delete />
                </el-icon>
              </el-tooltip>
              <el-icon :class="{ rotate: expandedIndex === index }">
                <i-ep-arrow-down class="svg-button-hover-color" />
              </el-icon>
            </div>
          </div>

          <div v-if="expandedIndex === index" class="column-details">
            <base-form-item label="列名：" required>
              <template #label>
                {{ t('dataManage.columnName') }}：
                <el-tooltip effect="light" :content="t('dataManage.databaseNameTip')" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
              </template>
              <el-input v-model="column.columnName" placeholder="请输入列名称" clearable />
            </base-form-item>

            <base-form-item label="备注：">
              <el-input v-model="column.comment" placeholder="请输入备注" type="textarea" :rows="2" maxlength="100" show-word-limit clearable />
            </base-form-item>

            <base-form-item label="列类别：" required>
              <el-select v-model="column.cateGory" placeholder="请选择列类别" @change="handleColumnTypeChange(index)">
                <el-option v-for="item in columnTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </base-form-item>

            <base-form-item label="数据类型：" required>
              <el-select v-model="column.dataType" placeholder="请选择数据类型" :disabled="['TAG', 'ATTRIBUTE'].includes(column.cateGory)">
                <el-option v-for="item in dataTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </base-form-item>
          </div>
        </div>
      </div>

      <!-- 添加列按钮 -->
      <base-form-item>
        <el-button type="primary" :disabled="!canAddColumn" @click="addColumn">添加列 ({{ formData.columns.length }}/10)</el-button>
      </base-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox, ElDialog, ElForm, ElInput, ElSelect, ElOption, ElButton, ElDivider, ElTooltip, ElIcon } from 'element-plus';
import { IoTDBApi } from '@/api';

const emit = defineEmits<{
  (event: 'handleReload'): void;
}>();

const { t } = useI18n();
const dialogVisible = ref(false);
const formRef = ref(null);
const expandedIndex = ref(-1);
const { requestFn: saveTable } = useRequest(IoTDBApi.saveTable);

const columnTypeOptions = [
  { label: 'TAG', value: 'TAG' },
  { label: 'FIELD', value: 'FIELD' },
  { label: 'ATTRIBUTE', value: 'ATTRIBUTE' },
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
  expandedIndex.value = formData.columns.length - 1;
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
  expandedIndex.value = index + 1;
  ElMessage.success('列已复制');
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
      if (expandedIndex.value === index) {
        expandedIndex.value = -1;
      } else if (expandedIndex.value > index) {
        expandedIndex.value--;
      }
      ElMessage.success('列已删除');
    })
    .catch(() => {});
};

// 展开/收起列详情
const toggleExpand = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? -1 : index;
};

// 重置表单
const resetForm = () => {
  formData.tableName = '';
  formData.ttl = '';
  formData.columns = [];
  expandedIndex.value = -1;
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
      expandedIndex.value = i;
      return;
    }
    if (!column.cateGory) {
      ElMessage.warning(`请选择第 ${i + 1} 列的列类别`);
      expandedIndex.value = i;
      return;
    }
    if (!column.dataType) {
      ElMessage.warning(`请选择第 ${i + 1} 列的数据类型`);
      expandedIndex.value = i;
      return;
    }
  }

  // 这里可以添加提交表单的逻辑
  console.log('表单数据:', JSON.parse(JSON.stringify(formData)));
  formDataBody.value.database = currentNode.value?.nodeName || '';
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
  saveTable(formDataBody.value)
    .then(() => {
      ElMessage.success('表创建成功');
      dialogVisible.value = false;
      resetForm();
      emit('handleReload');
    })
    .catch((error) => {
      ElMessage.error(`表创建失败: ${error.message}`);
    });
};

// 关闭弹窗确认
const handleClose = (done: any) => {
  ElMessageBox.confirm('确定要关闭吗？未保存的数据将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      resetForm();
      done();
    })
    .catch(() => {});
};

// 暴露方法供父组件调用
defineExpose({
  open: (currentVal: IoTDB.TreeNodeData) => {
    currentNode.value = currentVal;
    if (currentVal) {
      formData.ttl = currentVal.ttl || '';
    }
    dialogVisible.value = true;
  },
  close: () => {
    dialogVisible.value = false;
    resetForm();
  },
});
</script>
<style lang="scss" scoped>
.el-divider {
  margin: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.column-list {
  margin-bottom: 20px;
}

.column-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 10px;
  overflow: hidden;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: #f5f7fa;
  cursor: pointer;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.column-type {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.column-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.column-actions .el-icon {
  color: #606266;
  cursor: pointer;
  transition: all 0.3s;
}

.column-actions .el-icon:hover {
  color: #1890ff;
}

.rotate {
  transform: rotate(180deg);
}

.column-details {
  padding: 15px;
  background-color: #fff;
}

.base-form-item {
  margin-bottom: 18px;
}
</style>
