<template>
  <el-dialog :title="t('aiAnalysis.writeBack')" v-model="dialogVisible" width="480px" align-center>
    <el-form ref="formRef" :model="formData" :rules="formRules" :label-width="locale === 'en' ? '104px' : '110px'" label-position="right">
      <base-form-item :label="`${t('aiAnalysis.sourceName')}：`" prop="oldName" class="type-input-disabled el-form-item-not-mandatory">
        <el-descriptions :column="1">
          <el-descriptions-item :label="`${t('aiAnalysis.writeBackSourceDatabase')}：`">{{ props.database }}</el-descriptions-item>
          <el-descriptions-item :label="`${t('aiAnalysis.writeBackSourceTable')}：`">{{ props.table }}</el-descriptions-item>
          <el-descriptions-item :label="`${t('aiAnalysis.writeBackSourceTags')}：`">{{ props.tags?.map((tag) => tag.value).join(', ') }}</el-descriptions-item>
          <el-descriptions-item :label="`${t('aiAnalysis.writeBackSourceMeasurement')}：`">
            {{ props.fieldName }}
          </el-descriptions-item>
        </el-descriptions>
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.modelSelect')}：`" :placeholder="t('aiAnalysis.modelSelectPlaceholder')" prop="modelId">
        <el-select v-model="formData.modelId" :id="`write-back-modal-model`">
          <el-option v-for="item in props.modelIdList" :key="item" :label="item" :value="item" />
        </el-select>
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.writeBackTargetDatabase')}：`" prop="database">
        <el-input v-model="formData.database" :placeholder="t('common.placeHolder')" :id="`write-back-modal-database`" />
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.writeBackTargetTable')}：`" prop="table">
        <el-input v-model="formData.table" :placeholder="t('common.placeHolder')" :id="`write-back-modal-table`" />
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.writeBackTargetTags')}：`" prop="tags">
        <template v-for="(tag, index) in formData.tags" :key="index">
          <div class="flex items-center mb-2">
            <el-input v-model="formData.tags[index].tagName" class="w-[120px]" :placeholder="t('common.placeHolder')" :id="`write-back-modal-tags-${index}`" />
            <span class="p-[8px]">：</span>
            <el-input class="flex-1" v-model="formData.tags[index].tagValue" :placeholder="t('common.placeHolder')" :id="`write-back-modal-tag-value-${index}`" />
          </div>
        </template>
      </base-form-item>
      <base-form-item :label="`${t('aiAnalysis.writeBackTargetMeasurement')}：`" prop="measurement">
        <el-input v-model="formData.fieldName" :placeholder="t('common.placeHolder')" :id="`write-back-modal-measurement`" />
      </base-form-item>
    </el-form>
    <div class="exits-tip" v-if="measurementExist">
      <el-icon color="#495AD4" class="m-l-0 m-r-8" size="18">
        <i-ep-warning-filled />
      </el-icon>
      <p class="leading-[18px]">
        {{ t('aiAnalysis.measurementExist') }}
      </p>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel" :id="`write-back-modal-cancel`">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" :id="`write-back-modal-confirm`">
          {{ measurementExist ? t('common.confirmAndContinue') : t('common.confirm') }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import type { TagFilter, WriteBackTableFrom } from '@/types';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    saveLoading: boolean;
    database: string;
    table: string;
    tags?: TagFilter[];
    fieldName: string;
    modelIdList: string[];
  }>(),
  {},
);

const emit = defineEmits<{
  (event: 'handleSave', payload: WriteBackTableFrom): void;
}>();

// 测点已存在
const measurementExist = ref(false);

const { t, locale } = useI18n();

const dialogVisible = defineModel<boolean>('visible');
const formRef = ref<FormInstance>();
const formData = reactive<WriteBackTableFrom>({
  database: props.database,
  table: props.table,
  tags: props.tags?.map((tag) => ({ tagName: tag.variable, tagValue: tag.value })) || [],
  fieldName: props.fieldName,
  modelId: '',
});
const formRules = reactive<FormRules>({
  database: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
  ],
  table: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
  ],
  fieldName: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
  ],
  modelId: [
    {
      required: true,
      message: t('common.formRuleEmptyOperateShort'),
      trigger: 'blur',
    },
  ],
});

function handleCancel() {
  dialogVisible.value = false;
}

function save() {
  emit('handleSave', {
    database: formData.database,
    table: formData.table,
    tags: formData.tags,
    fieldName: formData.fieldName,
    modelId: formData.modelId,
  });
}

function handleConfirm() {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (
        formData.database === props.database &&
        formData.table === props.table &&
        formData.fieldName === props.fieldName &&
        formData.tags.length === (props.tags?.length || 0) &&
        formData.tags.every((tag, index) => tag.tagName === props.tags?.[index]?.variable && tag.tagValue === props.tags?.[index]?.value)
      ) {
        // 如果数据没有变化，提示是否写回原测点
        ElMessageBox.confirm(t('aiAnalysis.writeBackUnchangedTips'), t('common.confirm'), {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning',
        })
          .then(() => {
            save();
          })
          .catch(() => {
            dialogVisible.value = false;
          });
        dialogVisible.value = false;
        return;
      }
      save();
    }
  });
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      nextTick(() => {
        formData.database = props.database;
        formData.table = props.table;
        formData.tags = props.tags?.map((tag) => ({ tagName: tag.variable, tagValue: tag.value })) || [];
        formData.fieldName = props.fieldName;
      });
    }
  },
);
</script>

<style lang="scss" scoped>
.type-input-disabled {
  :deep(.el-input__inner) {
    color: #131926;
    -webkit-text-fill-color: #131926;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none;
  }
}

.exits-tip {
  padding: 8px 6px 8px 8px;
  border-radius: 2px;
  background: #f7f8fc;
  display: flex;
  flex-direction: row;
}
</style>
