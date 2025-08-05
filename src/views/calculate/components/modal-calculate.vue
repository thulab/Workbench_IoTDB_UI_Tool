<template>
  <el-dialog
    :title="editType === 'add' ? `${appType === 1 ? t('calculate.newCalculate') : t('calculate.newView')}` : `${appType === 1 ? t('calculate.editCalculate') : t('calculate.editView')}`"
    v-model="dialogVisible"
    width="748px"
    align-center
    :close-on-click-modal="false"
    id="calculate-modal"
  >
    <el-form ref="formRef" :model="formData" class="source-form" label-position="left" :label-width="locale === 'en' ? '184px' : '110px'">
      <base-form-item :label="`${appType === 1 ? t('calculate.calculateName') : t('calculate.viewName')}：`" prop="name" :rules="requiredRules" class="form-label-width">
        <el-input
          v-model="formData.name"
          show-word-limit
          maxlength="20"
          :placeholder="appType === 1 ? t('calculate.calculateNamePlaceholder') : t('calculate.viewNamePlaceholder')"
          id="calculate-modal-name"
        />
      </base-form-item>
      <base-form-item :label="`${appType === 1 ? t('calculate.calculateDesc') : t('calculate.viewDesc')}：`" prop="desc" class="form-label-width form-label-normal">
        <el-input
          type="textarea"
          v-model="formData.desc"
          show-word-limit
          maxlength="100"
          :placeholder="appType === 1 ? t('calculate.calculateDescPlaceholder') : t('calculate.viewDescPlaceholder')"
          :resize="'none'"
          class="desc-textarea"
          id="calculate-modal-desc"
        />
      </base-form-item>
      <base-form-item prop="measurement" :rules="requiredRules" class="form-label-width">
        <template #label>
          {{ t('calculate.resultMeasurement') }}：
          <el-tooltip effect="light" :content="t('calculate.descTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
        </template>
        <el-input v-model="formData.measurement" :placeholder="t('calculate.resultMeasurementPlaceholder')" v-if="editType === 'add'" id="calculate-modal-measurement">
          <template #prepend>root.</template>
        </el-input>
        <el-input v-model="formData.measurement" v-else disabled class="input-disabled" id="calculate-modal-measurement-disabled" />
      </base-form-item>
      <base-form-item prop="expression" :rules="requiredExpressionRules" class="form-expression-box">
        <template #label>
          {{ appType === 1 ? t('calculate.calculateExpression') : t('calculate.viewExpression') }}：
          <el-tooltip effect="light" placement="top">
            <i-custom-question />
            <template #content>
              <p style="color: #131926; font-weight: 300; width: 230px">
                {{ t('calculate.expressionTip') }}
                <a :href="t('common.viewLink')" target="_blank" rel="noopener noreferrer" style="color: #495ad4">
                  {{ t('common.doc') }}
                </a>
              </p>
            </template>
          </el-tooltip>
        </template>
        <div class="calculate-expression-box">
          <div class="code-box">
            <code-editor
              v-show="codeMirrorReady"
              v-model:model-value="formData.expression"
              @ready="() => (codeMirrorReady = true)"
              :style="{
                height: `288px`,
                backgroundColor: '#F7F8FC',
              }"
              ref="codeEditorRef"
            />
            <div class="quick-box-container">
              <div class="quick-box">
                <el-tabs v-model="activeNameSide" class="tabs-nav-aside">
                  <el-tab-pane :label="t('measurement.measurement')" name="data">
                    <side-data @get-function="getFunction" ref="sideDataRef" />
                  </el-tab-pane>
                  <el-tab-pane :label="t('search.function')" name="function">
                    <side-function @get-function="getFunction" />
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </div>
        </div>
      </base-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" id="calculate-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" id="calculate-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';
import { CalculateApi } from '@/api';
import CodeEditor from '@/views/search/components/code-editor.vue';
import SideData from './side-data.vue';
import SideFunction from './side-function.vue';
import type { CalculateItem } from '@/types';

const props = defineProps<{
  visible: boolean;
  editType: string;
  editData?: CalculateItem;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave'): void;
}>();

const { t, locale } = useI18n();
const appType = Number(import.meta.env.VITE_APP_TYPE);
const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();
const codeEditorRef = ref<InstanceType<typeof CodeEditor>>();
const sideDataRef = ref<InstanceType<typeof SideData>>();
const codeMirrorReady = ref(false);
const activeNameSide = ref('data');

const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: 'blur',
  },
]);

const requiredExpressionRules = ref<FormRules>([
  {
    required: true,
    validator: (rule, value, callback) => {
      if (!value || !value.trim()) {
        return callback(new Error(t('common.formRuleEmptyOperateShort')));
      }
      return callback();
    },
    trigger: 'blur',
  },
]);

const formData = reactive({
  name: '',
  desc: '',
  measurement: '',
  expression: '',
});
const saveLoading = ref(false);

const { requestFn: saveCalculate } = useRequest(CalculateApi.saveCalculate);
const { requestFn: updateCalculate } = useRequest(CalculateApi.updateCalculate);

// 追加code
function getFunction(val: string) {
  codeEditorRef.value?.insertContent(val);
}

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      saveLoading.value = true;
      if (props.editType === 'add') {
        saveCalculate({
          ...formData,
          measurement: `root.${formData.measurement}`,
        })
          .then(() => {
            ElMessage.success({ message: t('common.createSuccess'), grouping: true });
            dialogVisible.value = false;
            emit('handleSave');
          })
          .finally(() => {
            saveLoading.value = false;
          });
      } else {
        updateCalculate({
          ...formData,
          measurement: `${formData.measurement}`,
        })
          .then(() => {
            ElMessage.success({ message: t('common.changeSuccess'), grouping: true });
            dialogVisible.value = false;
            emit('handleSave');
          })
          .finally(() => {
            saveLoading.value = false;
          });
      }
    }
  });
};

watch(
  () => formData.expression,
  (newVal) => {
    if (newVal) {
      const real = formData.expression.trim();
      if (real) {
        formRef.value?.clearValidate('expression');
      }
    }
  },
  {
    immediate: true,
  },
);

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      activeNameSide.value = 'data';
      sideDataRef.value?.init();
      saveLoading.value = false;
      if (props.editType === 'edit' && props.editData) {
        formData.name = props.editData.name;
        formData.desc = props.editData.desc;
        formData.measurement = props.editData.measurement;
        formData.expression = props.editData.expression || '';
      } else {
        formData.name = '';
        formData.desc = '';
        formData.measurement = '';
        formData.expression = '';
      }
    }
  },
);
</script>

<style lang="scss" scoped>
.form-label-normal {
  :deep(.el-form-item__label) {
    padding-left: 9px;
  }
}

.desc-textarea {
  :deep(.el-textarea__inner) {
    // height: 44px;
  }
}

.input-disabled {
  :deep(.el-input__inner) {
    color: #131926;
    -webkit-text-fill-color: #131926;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none;
  }
}

.form-expression-box {
  flex-direction: column;

  :deep(.el-form-item__label) {
    justify-content: flex-start;
    width: fit-content;
  }
}

.calculate-expression-box {
  width: 100%;
  height: 288px;
  box-sizing: border-box;
  position: relative;

  .code-box {
    width: calc(100% - 238px);

    :deep(.cm-scroller::-webkit-scrollbar-track) {
      background-color: #f7f8fc !important;
    }

    :deep(.cm-scroller::-webkit-scrollbar-corner) {
      background-color: #f7f8fc !important;
    }
  }

  .quick-box-container {
    width: 238px;
    background-color: #f7f8fc;
    padding: 5px 4px 5px 8px;
    height: 100%;
    box-sizing: border-box;
    position: absolute;
    top: 0;
    right: 0;
  }

  .quick-box {
    padding: 0 8px;
    background: #fff;
    box-sizing: border-box;
    height: 100%;

    :deep(.el-tabs__header) {
      margin: 0 0 12px;
    }

    :deep(.el-tabs__item) {
      width: 105px;
      padding: 0;
      font-size: 14px;
      font-weight: 400;
      line-height: 21px;
      height: 27px;
      color: #131926;
    }

    :deep(.el-tabs__item.is-active) {
      color: #495ad4;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background-color: #dfe1ed;
    }
  }
}

.dialog-footer {
  margin-top: -24px;
}
</style>
