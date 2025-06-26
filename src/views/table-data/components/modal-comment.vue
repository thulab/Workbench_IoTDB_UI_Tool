<template>
  <el-dialog v-model="dialogVisible" :title="t('dataManage.comment')" width="540px" align-center :close-on-click-modal="false" id="auth-user-modal">
    <el-form label-width="80px" ref="formRef" :rules="rules" :model="formData" label-position="left" :key="formKey">
      <label><input type="password" autocomplete="new-password" hidden /></label>
      <base-form-item :label="t('dataManage.comment')" prop="comment">
        <el-input v-model="formData.comment" autocomplete="off" maxlength="100" show-word-limit type="textarea" :rows="6" />
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
  currentTable?: string | null;
  currentColumn?: string | null;
  currentComment?: string | null;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  handleSave: [payload: string];
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formKey = ref(0);

const formData = reactive({
  comment: '',
});

const rules = reactive<FormRules>({
  comment: [
    {
      required: true,
      message: () => t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
  ],
});
const { requestFn: alterComment, loading } = useRequest(IoTDBApi.alterComment);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      alterComment({
        database: props.currentDatabase!,
        tableName: props.currentTable || '',
        tableComment: !props.currentColumn ? formData.comment : undefined,
        columnName: props.currentColumn || undefined,
        columnComment: props.currentColumn ? formData.comment : undefined,
      }).then(() => {
        ElMessage.success({ message: t('common.submitSuccess'), grouping: true });
        dialogVisible.value = false;
        emit('handleSave', formData.comment);
      });
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formKey.value++;
      if (props.currentComment && props.currentComment !== 'null') {
        formData.comment = props.currentComment;
      } else {
        formData.comment = '';
      }
    }
  }
);
</script>
