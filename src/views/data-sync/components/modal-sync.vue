<template>
  <el-dialog
    :title="editType === 'add' ? '新建任务' : '任务详情'"
    v-model="dialogVisible"
    width="780px"
    align-center
    :close-on-click-modal="false"
    id="calculate-modal"
  >
    <el-form ref="formRef" :model="formData" class="source-form" label-position="left">
      <base-form-item label="计算名称：" prop="name" :rules="requiredRules" class="form-label-width">
        <el-input v-model="formData.name" show-word-limit maxlength="20" placeholder="请输入计算名称" id="calculate-modal-name" />
      </base-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" id="calculate-modal-cancel">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" id="calculate-modal-confirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { CalculateApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  editType: string;
  editData?: Calculate.CalculateItem;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();

const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: ['blur', 'change'],
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

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      saveLoading.value = true;
      if (props.editType === 'add') {
        saveCalculate({
          ...formData,
          measurement: `root.${formData.measurement}`,
        }).then(() => {
          ElMessage.success('创建成功');
          dialogVisible.value = false;
          emit('handleSave');
        }).finally(() => {
          saveLoading.value = false;
        });
      } else {
        updateCalculate({
          ...formData,
          measurement: `${formData.measurement}`,
        }).then(() => {
          ElMessage.success('编辑成功');
          dialogVisible.value = false;
          emit('handleSave');
        }).finally(() => {
          saveLoading.value = false;
        });
      }
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      saveLoading.value = false;
      if (props.editType === 'view' && props.editData) {
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

.form-label-width{
  :deep(.el-form-item__label) {
    width: 90px;

    svg{
      right: 10px;
    }
  }
}

.form-label-normal{
  :deep(.el-form-item__label) {
    padding-left: 9px;
  }
}

.desc-textarea{
  :deep(.el-textarea__inner) {
    // height: 44px;
  }
}

.input-disabled{
  :deep(.el-input__inner){
    color: #131926;
    -webkit-text-fill-color: #131926;
  }

  :deep(.el-input__wrapper){
    box-shadow: none;
  }
}

.form-expression-box{
  flex-direction: column;

  :deep(.el-form-item__label) {
    justify-content: flex-start;
    width: fit-content;

    svg{
      right: 10px;
    }
  }
}

.calculate-expression-box{
  width: 100%;
  height: 216px;
  box-sizing: border-box;
  position: relative;

  .code-box{
    width: calc(100% - 238px);

    :deep(.cm-scroller::-webkit-scrollbar-track){
      background-color: #F7F8FC !important;
    }

    :deep(.cm-scroller::-webkit-scrollbar-corner){
      background-color: #F7F8FC !important;
    }
  }

  .quick-box-container{
    width: 238px;
    background-color: #F7F8FC;
    padding: 5px 4px 5px 8px;
    height: 100%;
    box-sizing: border-box;
    position: absolute;
    top: 0;
    right: 0;
  }

  .quick-box{
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

    :deep(.el-tabs__item.is-active){
      color: #495ad4;
    }

    :deep(.el-tabs__nav-wrap::after){
      height: 1px;
      background-color: #DFE1ED;
    }
  }
}

.dialog-footer{
  margin-top: -24px;
}
</style>
