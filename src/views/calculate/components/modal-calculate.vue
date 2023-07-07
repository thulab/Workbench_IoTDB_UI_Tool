<template>
  <el-dialog
    :title="editType === 'add' ? '创建计算' : '编辑计算'"
    v-model="dialogVisible"
    width="780px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" class="source-form" label-position="right">
      <base-form-item label="计算名称：" prop="name" :rules="requiredRules" class="form-label-width">
        <el-input v-model="formData.name" show-word-limit maxlength="20" placeholder="请输入计算名称" />
      </base-form-item>
      <base-form-item label="计算描述：" prop="desc" class="form-label-width">
        <el-input type="textarea" v-model="formData.desc" show-word-limit maxlength="100" placeholder="请输入计算描述" :resize="'none'" class="desc-textarea" />
      </base-form-item>
      <base-form-item label="结果测点：" prop="measurement" :rules="requiredRules" class="form-label-width">
        <template #label>
          结果测点：<el-tooltip effect="light" content="数据类型根据表达式计算逻辑推断生成，编码方式及压缩方式为null" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
        </template>
        <el-input v-model="formData.measurement" placeholder="请输入结果测点名称" v-if="editType === 'add'">
          <template #prepend>root.</template>
        </el-input>
        <el-input v-model="formData.measurement" v-else disabled class="input-disabled" />
      </base-form-item>
      <base-form-item label="计算表达式：" prop="expression" :rules="requiredRules" class="form-expression-box">
        <template #label>
          计算表达式：<el-tooltip effect="light" placement="top">
            <i-custom-question />
            <template #content>
              <p style="color: #131926;font-weight: 300;width: 230px;">支持使用运算符及函数(除聚合函数), 如: root.sgcc.wf03.wt01.temperature + 1，详细规则见
                <a
                  href="https://www.timecho.com/docs/zh/UserGuide/V1.1.x/Operators-Functions/Overview.html#%E8%BF%90%E7%AE%97%E7%AC%A6%E5%92%8C%E5%87%BD%E6%95%B0"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="color: #495ad4;"
                >文档</a></p>
            </template>
          </el-tooltip>
        </template>
        <div class="calculate-expression-box">
          <div class="code-box">
            <code-editor
              v-show="codeMirrorReady"
              v-model:model-value="formData.expression"
              @ready="()=>codeMirrorReady = true"
              :style="{
                height: `216px`,
                backgroundColor: '#F7F8FC',
              }"
              ref="codeEditorRef"
            />
            <div class="quick-box-container">
              <div class="quick-box">
                <el-tabs v-model="activeNameSide" class="tabs-nav-aside">
                  <el-tab-pane label="测点" name="data">
                    <side-data @get-function="getFunction" ref="sideDataRef" />
                  </el-tab-pane>
                  <el-tab-pane label="函数" name="function">
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance } from 'element-plus';
import { CalculateApi } from '@/api';
import CodeEditor from '@/views/search/components/code-editor.vue';
import SideData from './side-data.vue';
import SideFunction from './side-function.vue';

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
const codeEditorRef = ref<InstanceType<typeof CodeEditor>>();
const sideDataRef = ref<InstanceType<typeof SideData>>();
const codeMirrorReady = ref(false);
const activeNameSide = ref('data');

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

const { requestFn: saveCalculate } = useRequest(CalculateApi.saveCalculate);
const { requestFn: updateCalculate } = useRequest(CalculateApi.updateCalculate);

// 追加code
function getFunction(val: string) {
  codeEditorRef.value?.insertContent(val);
}

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (props.editType === 'add') {
        saveCalculate({
          ...formData,
          measurement: `root.${formData.measurement}`,
        }).then(() => {
          ElMessage.success('创建成功');
          dialogVisible.value = false;
          emit('handleSave');
        });
      } else {
        updateCalculate({
          ...formData,
          measurement: `${formData.measurement}`,
        }).then(() => {
          ElMessage.success('编辑成功');
          dialogVisible.value = false;
          emit('handleSave');
        });
      }
    }
  });
};

watch(
  () => formData.expression,
  (newVal) => {
    if (newVal) {
      formRef.value?.clearValidate('expression');
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

.form-label-width{
  :deep(.el-form-item__label) {
    width: 90px;
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
