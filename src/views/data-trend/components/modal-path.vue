<template>
  <el-dialog
    title="添加测点"
    v-model="dialogVisible"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData">
      <base-form-item label="测点名称：" prop="path" :rules="requiredRules">
        <template #label>
          测点名称：<el-tooltip effect="light" content="关键字搜索仅展示100条搜索结果，如有需要请精确搜索" placement="top"><i-custom-question /></el-tooltip>
        </template>
        <el-select
          v-model="formData.path"
          placeholder="请输入告警测点"
          filterable
          remote
          remote-show-suffix
          fit-input-width
          :remote-method="remoteMethod"
          :loading="measurementLoading"
          style="width: 235px;"
        >
          <el-option v-for="item in measurementList" :key="item.timeseries" :label="item.timeseries" :value="item.timeseries" :disabled="item.dataType === 'TEXT' || pathList.includes(item.timeseries)">
            <div style="display: flex; width: 200px;">
              <text-tooltip :content="item.timeseries" />
            </div>
          </el-option>
        </el-select>
      </base-form-item>
      <div class="chart-detail-box">
        <base-form-item label="颜色：" prop="color" :rules="requiredRules">
          <el-color-picker v-model="formData.color" color-format="hex" :predefine="predefineColors" />
        </base-form-item>
        <base-form-item class="chart-width-box" label="线宽：" prop="width" :rules="requiredNumberRules">
          <el-input-number v-model.number="formData.width" :min="1" :max="10" step-strictly controls-position="right" style="width: 40px;" />
        </base-form-item>
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer m-t-10">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import type { FormInstance } from 'element-plus';
import { StorageApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  pathList: string[];
  predefineColors: string[];
  defaultColor: string;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean],
  'handleSave':[obj: Trend.LineObj],
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();
const formData = reactive<Trend.LineObj>({
  path: '',
  color: '',
  width: 2,
});
const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: ['blur', 'change'],
  },
]);
const checkNumber = (rule: any, value: any, callback: any) => {
  if (!value && value !== 0) {
    return callback(new Error('请输入相应内容后进行操作'));
  }
  if (!/^[1-9]\d*$/.test(`${value}`)) {
    return callback(new Error('只支持输入1-10范围内的正整数'));
  }
  if (value < 1 || value > 10) {
    return callback(new Error('只支持输入1-10范围内的正整数'));
  }
  return callback();
};
const requiredNumberRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: ['blur'],
  },
  {
    required: true,
    validator: checkNumber,
    trigger: ['blur'],
  },
]);
const measurementList = ref<StorageDevice.MeasurementDataItem[]>([]);

const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementAllObjList);

let lastMeasurementQuery = '';
const remoteMethod = debounce((query: string) => {
  lastMeasurementQuery = query;
  getMeasurement(lastMeasurementQuery).then((res) => {
    if (lastMeasurementQuery === query) {
      measurementList.value = res.data?.measurements?.map((item) => item) || [];
    }
  });
}, 500);

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      dialogVisible.value = false;
      emit('handleSave', formData);
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formData.width = 2;
      formData.color = props.defaultColor;
      remoteMethod('');
    }
  },
);

</script>

<style lang="scss" scoped>
  .chart-detail-box{
    display: flex;
    margin-top: 24px;

    .chart-width-box{
      margin-left: 36px;
    }
  }
</style>
