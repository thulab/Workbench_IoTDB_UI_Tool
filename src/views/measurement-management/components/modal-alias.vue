<template>
  <el-dialog
    title="编辑"
    v-model="dialogVisible"
    width="480px"
    align-center
    :close-on-click-modal="false"
    id="alias-modal-database"
  >
    <el-form ref="formRef" :model="formData" label-position="left" @submit.prevent>
      <base-form-item label="测点描述:" prop="alias">
        <el-input v-model="formData.alias" placeholder="请输入测点描述" maxlength="50" show-word-limit id="alias-modal-alias" type="textarea" :resize="'none'" />
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="alias-modal-cancel">取消</el-button>
        <el-button type="primary" :loading="saveloading" @click="handleConfirm" id="alias-modal-confirm">确定</el-button>
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
    ElMessage.success('修改成功！');
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
