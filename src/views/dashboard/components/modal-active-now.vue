<template>
  <el-dialog :title="t('dashboard.activeNow')" v-model="dialogVisible" :loading="machineCodeLoading" width="624px" align-center :close-on-click-modal="false" id="active-modal" class="active-modal">
    <el-form ref="formRef" :model="formData" class="m-t-14 m-b-34" @submit.prevent>
      <base-form-item :label="`${t('dashboard.machineCode')}：`" prop="machineCode">
        <div style="display: flex; align-items: flex-start">
          <div style="flex: 1; overflow-wrap: break-word; white-space: normal">{{ formData.machineCode }}</div>
          <el-icon :key="formData.machineCode" v-copy="formData.machineCode" size="24" class="svg-button-hover-color"><i-custom-copy /></el-icon>
        </div>
      </base-form-item>
      <base-form-item :label="`${t('dashboard.activeCode')}：`" prop="activeCode">
        <el-input v-model.trim="formData.activeCode" :placeholder="t('dashboard.activeCodePlaceholder')" type="textarea" :autosize="{ minRows: 4 }" />
        <span class="char-counter">{{ t('dashboard.totalCharacters', { count: formData.activeCode.length }) }}</span>
      </base-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="modal-reset-pwd-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="activeLoading" :disabled="!formData.activeCode" @click="handleConfirm" id="modal-reset-pwd-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { DashboardApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  isMaster: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);

const formRef = ref<FormInstance>();
const formData = reactive({
  machineCode: '',
  activeCode: '',
});

const { requestFn: getMachineCode, loading: machineCodeLoading } = useRequest(DashboardApi.getMachineCode);
const { requestFn: toActive, loading: activeLoading } = useRequest(DashboardApi.toActive);

function getDetail() {
  getMachineCode(props.isMaster).then((res) => {
    const machineCode = res.data;
    formData.machineCode = machineCode;
  });
}

function handleConfirm() {
  toActive(formData.activeCode, props.isMaster).then(() => {
    ElMessage.success(t('dashboard.activeSuccess'));
    dialogVisible.value = false;
  });
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formData.machineCode = '';
      formData.activeCode = '';
      getDetail();
    }
  },
);
</script>

<style lang="scss" scoped>
.char-counter {
  position: absolute;
  right: 14px;
  bottom: 8px;
  font-size: 12px;
  color: #909399;
  background: white;
  height: 14px;
}
</style>
