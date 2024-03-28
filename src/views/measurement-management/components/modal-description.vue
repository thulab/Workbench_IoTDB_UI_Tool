<template>
  <el-dialog :title="t('common.edit')" v-model="dialogVisible" width="480px" align-center :close-on-click-modal="false" id="description-modal-database">
    <el-form ref="formRef" :model="formData" label-position="left" @submit.prevent>
      <base-form-item :label="`${t('measurement.measurementDescription')}:`" prop="description">
        <el-input
          v-model="formData.description"
          :placeholder="t('measurement.measurementDescriptionPlaceholder')"
          maxlength="100"
          show-word-limit
          id="description-modal-alias"
          type="textarea"
          :resize="'none'"
        />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="description-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveloading" @click="handleConfirm" id="description-modal-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { StorageApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  measurement: string;
  description: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave'): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const saveloading = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive<{
  description: string;
}>({
  description: '',
});
const { requestFn: saveDescription } = useRequest(StorageApi.saveDescription);

const handleConfirm = () => {
  saveloading.value = true;
  saveDescription(props.measurement, formData.description)
    .then(() => {
      ElMessage.success({ message: `${t('common.editSuccess')}！`, grouping: true });
      dialogVisible.value = false;
      emit('handleSave');
    })
    .finally(() => {
      saveloading.value = false;
    });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      saveloading.value = false;
      formRef.value?.resetFields();
      formData.description = props.description || '';
    }
  }
);
</script>
