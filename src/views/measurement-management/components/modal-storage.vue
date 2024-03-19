<template>
  <el-dialog :title="t('measurement.newDataBase')" v-model="dialogVisible" width="480px" class="new-database-container" align-center :close-on-click-modal="false" id="new-database-modal-database">
    <el-form ref="formRef" :model="formData" :rules="rules" class="source-form m-t-8" label-position="left" :label-width="locale === 'en' ? '170px' : '130px'">
      <el-form-item :label="`${t('measurement.databaseName')}：`" prop="groupName">
        <el-input type="hidden" />
        <el-input v-model="formData.groupName" :placeholder="t('measurement.databaseNamePlaceholder')" maxlength="59" show-word-limit id="new-database-modal-groupName">
          <template #prepend>root.</template>
        </el-input>
      </el-form-item>
      <el-form-item prop="ttl" class="m-b-6">
        <template #label>
          <span style="margin-left: 9px">{{ t('measurement.databaseTTL') }}：</span>
          <el-tooltip effect="light" :content="t('measurement.databaseTTLTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
        </template>
        <el-input type="hidden" />
        <auth-tooltip :is-disabled="canWriteSchema">
          <el-input v-model="formData.ttl" min="0" max="9007199254740992" :disabled="!canWriteSchema" class="ttl-input" id="new-database-modal-ttl">
            <template #append>
              <el-select v-model="formData.ttlUnit" style="width: 80px" placeholder="" id="new-database-modal-ttlunit" :disabled="!canWriteSchema">
                <el-option :label="t('common.milliSecond')" value="millisecond" id="new-database-modal-ttl-ms" />
                <el-option :label="t('common.second')" value="second" id="new-database-modal-ttl-s" />
                <el-option :label="t('common.minute')" value="minute" id="new-database-modal-ttl-m" />
                <el-option :label="t('common.hour')" value="hour" id="new-database-modal-ttl-h" />
                <el-option :label="t('common.day')" value="day" id="new-database-modal-ttl-d" />
              </el-select>
            </template>
          </el-input>
        </auth-tooltip>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="new-database-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveloading" @click="handleConfirm" id="new-database-modal-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { StorageApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  canWriteSchema: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave'): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const { t, locale } = useI18n();
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
  ttl: [
    {
      required: false,
      pattern: /^[1-9]\d*$/,
      message: () => t('measurement.databaseTTLRule'),
      trigger: 'blur',
    },
  ],
});
const formData = reactive<{
  groupName: string | null;
  ttl: string | null;
  ttlUnit?: string;
}>({
  groupName: '',
  ttl: '',
  ttlUnit: 'day',
});
const { requestFn: saveStorageGroups, loading: saveloading } = useRequest(StorageApi.saveStorageGroups);

/**
 * new/edit storage
 */
const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (formData.ttl && +formData.ttl > 9007199254740992) {
        ElMessage.error(t('measurement.databaseTTLSaveMaxRule'));
        return;
      }
      if (formData.ttl && !formData.ttlUnit) {
        ElMessage.error(t('measurement.databaseTTLSaveUnitRule'));
        return;
      }
      const reqObj = {
        groupName: `root.${formData.groupName}`,
        ttl: !formData.ttl ? undefined : +formData.ttl,
        ttlUnit: formData.ttlUnit || undefined,
      };
      saveStorageGroups({ ...reqObj }).then((res) => {
        if (res.code === 0) {
          ElMessage.success(`${t('common.createSuccess')}!`);
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
      formData.ttlUnit = 'day';
    }
  }
);
</script>
