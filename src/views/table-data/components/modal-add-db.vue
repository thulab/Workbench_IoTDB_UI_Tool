<template>
  <el-dialog v-model="dialogVisible" :title="t('dataManage.addDatabase')" :width="locale === 'en' ? '540px' : '480px'" align-center :close-on-click-modal="false" id="auth-user-modal">
    <el-form :label-width="locale === 'en' ? '170px' : '120px'" ref="formRef" :rules="rules" :model="formData" label-position="left" :key="formKey">
      <label><input type="password" autocomplete="new-password" hidden /></label>
      <base-form-item :label="`${t('auth.userName')}：`" prop="databaseName" :error="errorName">
        <template #label>
          {{ t('dataManage.addDatabase') }}：
          <el-tooltip effect="light" :content="t('dataManage.databaseNameTip')" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
        </template>
        <el-input v-model.trim="formData.databaseName" maxlength="64" :placeholder="t('dataManage.databaseNamePlaceholder')" show-word-limit id="auth-user-modal-name" />
      </base-form-item>
      <base-form-item :label="`${t('dataManage.ttl')}：`" prop="ttl">
        <el-input v-model="formData.ttl" autocomplete="off" :placeholder="t('dataManage.ttlPlaceholder')" id="auth-user-modal-pwd">
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
import { storeToRefs } from 'pinia';
import type { FormInstance, FormRules } from 'element-plus';
import IoTDBApi from '@/api/db.api';
import { useDbStore } from '@/stores';

const formRef = ref<FormInstance>();

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  handleSave: [payload: string];
}>();
const errorName = ref<string | null>(null);
const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const formKey = ref(0);
const { setFirstLoad, setActiveList } = useDbStore();
const { databaseNames } = storeToRefs(useDbStore());

const formData = reactive({
  databaseName: '',
  ttl: '',
  ttlUnit: 'ms',
});

const rules = reactive<FormRules>({
  databaseName: [
    {
      required: true,
      message: () => t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
    {
      max: 64,
      message: () => t('dataManage.databaseNameLenth'),
      trigger: 'blur',
    },
    {
      validator: (rule, value, callback) => {
        if (value && databaseNames.value.some((name) => name.toLocaleLowerCase() === value.toLocaleLowerCase())) {
          callback(new Error(t('dataManage.databaseNameExist')));
        }

        // 情况1：简单名称（字母开头，可包含下划线和数字）
        const simplePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
        // 情况2：需要引号包裹的名称（包含特殊字符、中文或以数字开头）
        const needsQuotesPattern = /^".*"$/;
        // 特殊字符正则（包括中文、数字开头和各种特殊符号）
        const specialCharsPattern = /[`~!@#$%^&*()+=|{}':;',[\]<>/?\\]|[\u4e00-\u9fa5]|^[0-9]/;
        if (simplePattern.test(value)) {
          callback();
        } else if (specialCharsPattern.test(value) && !needsQuotesPattern.test(value)) {
          // 包含特殊字符但未用引号包裹
          callback(new Error(t('dataManage.specialCharsNeedQuotes'))); // Add i18n key
        } else if (needsQuotesPattern.test(value)) {
          // 检查引号内是否为空
          const unquoted = value.slice(1, -1);
          if (unquoted === '') {
            callback(new Error(t('dataManage.emptyQuotedName'))); // Add i18n key
          } else {
            callback();
          }
        } else {
          // 其他非法格式
          callback(new Error(t('dataManage.invalidNameFormat'))); // Add i18n key
        }
      },
      trigger: 'blur',
    },
  ],
});
const { requestFn: saveDatabase, loading } = useRequest(IoTDBApi.saveDatabase);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      saveDatabase(formData.databaseName, formData.ttl, formData.ttlUnit).then(() => {
        ElMessage.success({ message: t('dataManage.addDatabaseSuccess'), grouping: true });
        dialogVisible.value = false;
        setActiveList([formData.databaseName]);
        setFirstLoad(true);
        emit('handleSave', formData.databaseName);
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
    }
  },
);
</script>
