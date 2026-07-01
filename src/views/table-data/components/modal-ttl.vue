<template>
  <el-dialog
    v-model="dialogVisible"
    title="TTL(ms)"
    :width="locale === 'en' ? '540px' : '480px'"
    align-center
    :close-on-click-modal="false"
    id="auth-user-modal"
  >
    <el-form :label-width="locale === 'en' ? '170px' : '120px'" ref="formRef" :rules="rules" :model="formData" label-position="left" :key="formKey">
      <label><input type="password" autocomplete="new-password" hidden /></label>
      <base-form-item :label="`${t('dataManage.ttl')}：`" prop="ttl">
        <el-input
          v-model="formData.ttl"
          autocomplete="off"
          :placeholder="t('dataManage.ttlPlaceholder')"
          @input="handleTtlInput"
        >
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
import Validator from '@/utils/validator';

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
const hasInvalidTtlAttempt = ref(false);
let ttlNativeInput: HTMLInputElement | null = null;

const formData = reactive({
  ttl: '',
  ttlUnit: 'ms',
});

const rules = reactive<FormRules>({
  ttl: [
    {
      validator: (_rule, value, callback) => {
        if (hasInvalidTtlAttempt.value) {
          return callback(new Error(t('dataManage.ttlInvalidNumber')));
        }
        const result = Validator.validateTTL(value, t);
        if (result === true) {
          return callback();
        }
        callback(result as Error);
      },
    },
  ],
});
const { requestFn: upsertDatabase, loading } = useRequest(IoTDBApi.upsertDatabase);

const ttlAllowedControlKeys = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Enter',
  'Escape',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

const handleTtlInput = (value: string | number) => {
  if (String(value ?? '') === '') {
    hasInvalidTtlAttempt.value = false;
  }
};

const handleTtlKeydown = (event: KeyboardEvent) => {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }
  if (ttlAllowedControlKeys.has(event.key)) {
    return;
  }
  if (event.key.length === 1 && !/^\d$/.test(event.key)) {
    hasInvalidTtlAttempt.value = true;
  }
};

const handleTtlPaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text') ?? '';
  if (pastedText && !/^\d+$/.test(pastedText)) {
    hasInvalidTtlAttempt.value = true;
  }
};

const detachTtlNativeListeners = () => {
  ttlNativeInput?.removeEventListener('keydown', handleTtlKeydown);
  ttlNativeInput?.removeEventListener('paste', handleTtlPaste as EventListener);
  ttlNativeInput = null;
};

const attachTtlNativeListeners = async () => {
  await nextTick();
  detachTtlNativeListeners();
  ttlNativeInput = document.querySelector('#auth-user-modal .el-input__wrapper input');
  ttlNativeInput?.addEventListener('keydown', handleTtlKeydown);
  ttlNativeInput?.addEventListener('paste', handleTtlPaste as EventListener);
};

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
      hasInvalidTtlAttempt.value = false;
      if (props.currentTtl) {
        formData.ttl = props.currentTtl || '';
      } else {
        formData.ttl = '';
      }
      void attachTtlNativeListeners();
    } else {
      detachTtlNativeListeners();
    }
  },
);

onBeforeUnmount(() => {
  detachTtlNativeListeners();
});
</script>
