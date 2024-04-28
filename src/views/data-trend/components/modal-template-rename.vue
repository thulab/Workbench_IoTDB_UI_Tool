<template>
  <el-dialog :title="t('search.rename')" v-model="dialogVisible" width="480px" align-center>
    <el-form ref="resaveFormRef" :model="formData" :rules="formRules" :label-width="locale === 'en' ? '104px' : '80px'" label-position="left">
      <base-form-item :label="`${t('search.oldName')}：`" prop="oldSqlName" class="type-input-disabled el-form-item-not-mandatory">
        <el-input v-model="formData.oldSqlName" disabled id="trend-template-rename-modal-resave-old" />
      </base-form-item>
      <base-form-item :label="`${t('search.newName')}：`" prop="sqlName">
        <el-input v-model="formData.sqlName" :placeholder="t('common.placeHolder')" maxlength="25" show-word-limit id="trend-template-rename-modal-resave" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" id="trend-template-rename-modal-resave-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" id="trend-template-rename-modal-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';

const props = defineProps<{
  visible: boolean;
  oldSqlName: string;
  id: string;
  nameList: string[];
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave'): void;
}>();

const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();
const formData = reactive<{
  oldSqlName: string;
  sqlName: string;
  id: string;
}>({
  oldSqlName: '',
  sqlName: '',
  id: '',
});
const formRules = reactive({
  sqlName: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!value || !value.trim()) {
          return callback(new Error(t('search.newNameTip')));
        }
        if (value === formData.oldSqlName) {
          return callback(new Error(t('search.nameRepeatTip')));
        }
        if (value && props.nameList.some((item) => item === value)) {
          return callback(new Error(t('search.templateNameRepeatTip')));
        }
        return callback();
      },
      trigger: ['blur', 'change'],
    },
  ],
});
const saveLoading = ref(false);

function handleCancel() {
  dialogVisible.value = false;
}

function handleConfirm() {
  formRef.value?.validate((valid) => {
    if (valid) {
      // TODO 重命名接口
      saveLoading.value = true;
      saveLoading.value = false;
      ElMessage.success({ message: t('common.saveSuccess'), grouping: true });
      dialogVisible.value = false;
      emit('handleSave');
    }
  });
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formData.oldSqlName = props.oldSqlName;
      formData.id = props.id;
      saveLoading.value = false;
    }
  }
);
</script>
