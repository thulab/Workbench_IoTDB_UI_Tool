<template>
  <el-dialog :title="editData ? '编辑白名单' : '添加白名单'" v-model="dialogVisible" width="480px" class="new-storage-container" align-center :close-on-click-modal="false" id="white-list-modal">
    <el-form ref="formRef" :model="formData" :rules="rules" class="m-t-14" label-position="left" @submit.prevent>
      <base-form-item label="IP地址:" prop="ip">
        <el-input v-model.trim="formData.ip" placeholder="请输入IP地址" id="white-list-modal-ip" />
      </base-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer m-t-16">
        <el-button @click="dialogVisible = false" id="white-list-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveloading" @click="handleConfirm" id="white-list-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
// disable
import type { FormInstance } from 'element-plus';

const props = defineProps<{
  visible: boolean;
  editData: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave'): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const saveloading = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive({
  ip: '',
});

const ipRegExp = /^(?:(?:1[0-9][0-9]\.)|(?:2[0-4][0-9]\.)|(?:25[0-5]\.)|(?:[1-9][0-9]\.)|(?:[0-9/*]\.)){3}(?:(?:1[0-9][0-9])|(?:2[0-4][0-9])|(?:25[0-5])|(?:[1-9][0-9])|(?:[0-9/*]))$/;
const rules = reactive({
  ip: [
    {
      required: true,
      trigger: 'blur',
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          return callback(t('common.formRuleEmptyOperateShort'));
        }
        if (!ipRegExp.test(value)) {
          return callback(t('white.ipRuleTip'));
        }
        return callback();
      },
    },
  ],
});

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      ElMessage.success({ message: `${t('common.saveSuccess')}`, grouping: true });
      dialogVisible.value = false;
      emit('handleSave');
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formData.ip = props.editData ? props.editData : '';
    }
  },
);
</script>

<style scoped lang="scss">
.new-storage-container {
  position: relative;
}
</style>
