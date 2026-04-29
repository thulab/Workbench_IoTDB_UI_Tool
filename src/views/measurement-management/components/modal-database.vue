<template>
  <el-dialog :title="t('measurement.newDataBase')" v-model="dialogVisible" width="480px" class="new-database-container" align-center :close-on-click-modal="false" id="new-database-modal-database" data-testid="measurement-database-modal">
    <el-form ref="formRef" :model="formData" :rules="rules" class="source-form m-t-8" label-position="left">
      <base-form-item :label="`${t('measurement.databaseName')}：`" prop="groupName">
        <el-input v-model="formData.groupName" :placeholder="t('measurement.databaseNamePlaceholder')" maxlength="59" show-word-limit id="new-database-modal-groupName" data-testid="measurement-database-modal-name">
          <template #prepend>root.</template>
        </el-input>
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="new-database-modal-cancel" data-testid="measurement-database-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveloading" @click="handleConfirm" id="new-database-modal-confirm" data-testid="measurement-database-modal-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { StorageApi } from '@/api';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave'): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const { t } = useI18n();
const formRef = ref<FormInstance>();
const rules = reactive({
  groupName: [
    {
      required: true,
      message: () => t('measurement.databaseNamePlaceholder'),
      trigger: 'blur',
    },
    // {
    //   pattern: /^([`"'.a-zA-Z0-9_\u4e00-\u9fa5]*)$/,
    //   message: '请输入正确格式，只能由字母、数字、下划线以及UNICODE 中文字符组成',
    //   trigger: 'blur',
    // },
  ],
});
const formData = reactive<{
  groupName: string | null;
}>({
  groupName: '',
});
const { requestFn: saveDatabase, loading: saveloading } = useRequest(StorageApi.saveDatabase);

/**
 * new/edit storage
 */
const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      const reqObj = {
        groupName: `root.${formData.groupName}`,
        ttlUnit: 'day',
      };
      saveDatabase({ ...reqObj }).then((res) => {
        if (res.code === 0) {
          ElMessage.success({ message: `${t('common.createSuccess')}`, grouping: true });
          dialogVisible.value = false;
          emit('handleSave');
        }
      });
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
    }
  },
);
</script>
