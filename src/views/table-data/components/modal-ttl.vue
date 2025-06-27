<template>
  <el-dialog v-model="dialogVisible" title="TTL(ms)" width="540px' : '480px'" align-center :close-on-click-modal="false" id="auth-user-modal">
    <el-form :label-width="locale === 'en' ? '170px' : '120px'" ref="formRef" :rules="rules" :model="formData" label-position="left" :key="formKey">
      <label><input type="password" autocomplete="new-password" hidden /></label>
      <base-form-item :label="`${t('dataManage.ttl')}：`" prop="ttl">
        <el-input v-model="formData.ttl" autocomplete="off" :placeholder="t('dataManage.ttlPlaceholder')" @input="handleNumberInput">
          <template #append>ms</template>
        </el-input>
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="auth-user-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm" id="auth-user-modal-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import IoTDBApi from '@/api/db.api';

const formRef = ref<FormInstance>();

const props = defineProps<{
  visible: boolean;
  currentDatabase?: string;
  currentTable?: string;
  currentTtl?: string | null;
  type: string; // 'db' or 'table'
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  handleSave: [payload: string];
  appendSql: [sql: string];
}>();

const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formKey = ref(0);

const formData = reactive({
  ttl: '',
  ttlUnit: 'ms',
});

// 只允许输入数字
const handleNumberInput = (value: string) => {
  formData.ttl = value.replace(/[^\d]/g, '');
};

const rules = reactive<FormRules>({
  databaseName: [
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
  ],
});
const { requestFn: upsertDatabase, loading } = useRequest(IoTDBApi.upsertDatabase);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (props.type === 'table' && props.currentTable) {
        upsertDatabase({
          database: props.currentDatabase!,
          tableName: props.currentTable,
          ttl: formData.ttl,
          ttlUnit: formData.ttlUnit,
        }).then((resp) => {
          ElMessage.success({ message: t('dataManage.ttlUpdated'), grouping: true });
          dialogVisible.value = false;
          emit('handleSave', formData.ttl);
          emit('appendSql', resp.data.sql);
        });
      } else if (props.type === 'db') {
        // 更新数据库的TTL
        upsertDatabase({
          database: props.currentDatabase!,
          ttl: formData.ttl,
          ttlUnit: formData.ttlUnit,
        }).then((resp) => {
          ElMessage.success({ message: t('dataManage.ttlUpdated'), grouping: true });
          dialogVisible.value = false;
          emit('handleSave', formData.ttl);
          emit('appendSql', resp.data.sql);
        });
      }
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formKey.value++;
      if (props.currentTtl) {
        formData.ttl = props.currentTtl || '';
      } else {
        formData.ttl = '';
      }
    }
  }
);
</script>
