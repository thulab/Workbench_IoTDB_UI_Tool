<template>
  <el-dialog
    :title="t('common.edit')"
    v-model="dialogVisible"
    width="480px"
    align-center
    :close-on-click-modal="false"
    id="alias-modal-database"
  >
    <el-form ref="formRef" :model="formData" label-position="left" @submit.prevent>
      <base-form-item :label="`${t('measurement.measurementAlias')}:`" prop="alias">
        <el-input v-model="formData.alias" :placeholder="t('measurement.measurementAliasPlaceholder')" maxlength="50" show-word-limit id="alias-modal-alias" type="textarea" :resize="'none'" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="alias-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveloading" @click="handleConfirm" id="alias-modal-confirm">{{ t('common.confirm') }}</el-button>
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
  alias: string;
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
  alias: string;
}>({
  alias: '',
});
const { requestFn: saveAlias } = useRequest(StorageApi.saveAlias);

const handleConfirm = () => {
  saveloading.value = true;
  saveAlias(props.measurement, formData.alias).then(() => {
    ElMessage.success(`${t('common.editSuccess')}！`);
    dialogVisible.value = false;
    emit('handleSave');
  }).finally(() => {
    saveloading.value = false;
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      saveloading.value = false;
      formRef.value?.resetFields();
      formData.alias = props.alias || '';
    }
  },
);

</script>
