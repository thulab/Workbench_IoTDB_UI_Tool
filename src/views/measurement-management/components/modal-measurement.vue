<template>
  <el-dialog
    title="新建测点"
    v-model="dialogVisible"
    width="748px"
    :close-on-click-modal="false"
    id="measurement-modal-measurement"
  >
    <el-form ref="formRef" :model="formData" label-position="left">
      <h4 class="module-title">设备</h4>
      <el-form-item label="设备名称：" prop="deviceName" class="p-t-8" :rules="!addDevice ? requiredRules : deviceRules">
        <el-input type="hidden" />
        <div class="device-box">
          <el-select
            v-if="!addDevice"
            v-model="formData.deviceName"
            placeholder="请选择设备名称"
            filterable
            remote
            remote-show-suffix
            :remote-method="remoteMethod"
            :loading="deviceLoading"
            style="width: 400px;"
            @change="handleChangeDevice"
            id="measurement-modal-select-device"
          >
            <el-option v-for="item in deviceList" :key="item" :label="item" :value="item">
              <div style="display: flex; width: 360px;">
                <text-tooltip :content="item" />
              </div>
            </el-option>
          </el-select>
          <div v-else class="device-input-group">
            <el-input :value="groupName + '.'" disabled class="device-input-prepend" style="width: 144px;" id="measurement-modal-input-groupName" />
            <el-input v-model="formData.deviceName" placeholder="请输入设备名称" class="device-input-box" style="width: 256px;" id="measurement-modal-input-deviceName" />
          </div>

          <div class="device-operate m-l-12">
            <el-checkbox v-model="addDevice" label="新建设备" @change="handleChangeAdd" id="measurement-modal-checkbox-device-add" />
            <el-checkbox v-model="isAligned" label="按设备对齐" :disabled="!addDevice" id="measurement-modal-checkbox-device-align" />
          </div>
        </div>
      </el-form-item>
      <h4 class="module-title" style="border: none;">测点</h4>
      <el-scrollbar :max-height="400" :min-height="152" class="measurement-list-box">
        <el-collapse accordion v-model="activeName">
          <el-collapse-item v-for="(item, index) in formData.measurementList" :key="index" :name="'measurement_' + index">
            <template #title>
              <el-row class="collapse-title-box">
                <el-col :span="12"><div v-if="formData.deviceName" class="all-path-name">{{!addDevice ? `${formData.deviceName}.${item.timeseries}` : `${groupName}.${formData.deviceName}.${item.timeseries}`}}</div></el-col>
                <el-col :span="8">
                  <div class="collapse-data-type-box">
                    <span class="data-type-label">数据类型</span>
                    <span>{{ item.dataType }}</span>
                  </div>
                </el-col>
                <el-col :span="4">
                  <div class="operate-box">
                    <el-button link @click="(e)=>handleCopyRow(item, e)" :id="`measurement-modal-collapse-${index}-copy`"><i-custom-copy /></el-button>
                    <el-button link class="m-x-12" @click="(e)=>handleDelRow(index, e)" :id="`measurement-modal-collapse-${index}-del`"><i-custom-delete /></el-button>
                  </div>
                </el-col>
              </el-row>
            </template>
            <el-row>
              <el-col :span="8">
                <el-form-item label="测点名称：" :prop="'measurementList[' + index + '].timeseries'" :rules="requiredRules">
                  <el-input type="hidden" />
                  <el-input v-model="item.timeseries" placeholder="请输入测点名称" :disabled="!item.isEditable || !formData.deviceName" :id="`measurement-modal-collapse-${index}-timeseries`" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="8">
                <el-form-item label="数据类型：" :prop="'measurementList[' + index + '].dataType'" :rules="requiredRules">
                  <el-input type="hidden" />
                  <el-select v-model="item.dataType" placeholder="请选择数据类型" @change="val => handleChangeRowDataType(val, item, index)" :disabled="!item.isEditable || !formData.deviceName" :id="`measurement-modal-collapse-${index}-dataType`">
                    <el-option v-for="dtype in dataTypeOptions" :key="dtype" :label="dtype" :value="dtype" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="编码方式：" :prop="'measurementList[' + index + '].encoding'" :rules="requiredRules">
                  <el-input type="hidden" />
                  <el-select v-model="item.encoding" placeholder="请选择数据类型" :disabled="!item.isEditable || !item.dataType || !formData.deviceName" :id="`measurement-modal-collapse-${index}-encoding`">
                    <el-option v-for="enc in encodingOptions(item.dataType as string)" :key="enc" :label="enc" :value="enc" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="压缩方式：" :prop="'measurementList[' + index + '].compression'" :rules="requiredRules" style="margin-right: 0;">
                  <el-input type="hidden" />
                  <el-select v-model="item.compression" placeholder="请选择数据类型" :disabled="!item.isEditable || !formData.deviceName" :id="`measurement-modal-collapse-${index}-compression`">
                    <el-option v-for="com in compressionOptions" :key="com" :label="com" :value="com" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-scrollbar>

      <el-button style="width: 100%;" class="m-t-16" :disabled="addControl" @click="handleAddRow" id="measurement-modal-collapse-add"><i-custom-add class="m-r-4" />添加测点</el-button>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="measurement-modal-cancel">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" id="measurement-modal-confirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, CheckboxValueType } from 'element-plus';
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const props = defineProps<{
  visible: boolean;
  groupName: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const activeName = ref('measurement_0');

const { requestFn: getDevice, loading: deviceLoading } = useRequest(StorageApi.getDeviceByGroup);
const { requestFn: getMeasurementsInfosByFuzzy, loading: measurementLoading } = useRequest(StorageApi.getMeasurementsInfosByFuzzy);
const { requestFn: getIsAlignedDevice } = useRequest(StorageApi.getIsAlignedDevice);
const { requestFn: saveMeasurementList, loading: saveLoading } = useRequest(StorageApi.saveMeasurementList);
const { requestFn: deleteMeasurements } = useRequest(StorageApi.deleteMeasurements);

const dataTypeOptions = ['BOOLEAN', 'INT32', 'INT64', 'FLOAT', 'DOUBLE', 'TEXT'];
const encoding: { [key: string]: string[] } = {
  BOOLEAN: ['PLAIN', 'RLE'],
  INT32: ['RLE', 'PLAIN', 'TS_2DIFF', 'GORILLA', 'FREQ', 'ZIGZAG', 'CHIMP', 'SPRINTZ', 'RLBE'],
  INT64: ['RLE', 'PLAIN', 'TS_2DIFF', 'GORILLA', 'FREQ', 'ZIGZAG', 'CHIMP', 'SPRINTZ', 'RLBE'],
  FLOAT: ['GORILLA', 'PLAIN', 'RLE', 'TS_2DIFF', 'FREQ', 'CHIMP', 'SPRINTZ', 'RLBE'],
  DOUBLE: ['GORILLA', 'PLAIN', 'RLE', 'TS_2DIFF', 'FREQ', 'CHIMP', 'SPRINTZ', 'RLBE'],
  TEXT: ['PLAIN', 'DICTIONARY'],
};
const compressionOptions = ['UNCOMPRESSED', 'SNAPPY', 'LZ4', 'GZIP', 'ZSTD', 'LZMA2'];

const encodingOptions = computed(() => (val: string) => encoding[val]);

const formRef = ref<FormInstance>();
const deviceRules = ref([
  {
    required: true,
    message: '设备名称不能为空',
    trigger: ['blur', 'change'],
  },
  {
    pattern: /^`.*`$|^(["'.a-zA-Z0-9_\u4e00-\u9fa5]*)$/,
    message: '请输入正确格式，只能由字母、数字、下划线以及UNICODE 中文字符组成',
    trigger: 'blur',
  },
]);
const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: ['blur', 'change'],
  },
]);
const formData = reactive<{
  deviceName: string;
  measurementList: Array<Partial<StorageDevice.MeasurementItem>>;
}>({
  deviceName: '',
  measurementList: [],
});
const deviceList = ref<string[]>([]);
const addDevice = ref(false);
const isAligned = ref(false);

const addControl = computed(() => {
  if (!formData.deviceName) {
    return true;
  }
  if (formData.measurementList.length === 0) {
    return false;
  }
  const flag = formData.measurementList.some((s) => !s.timeseries || !s.dataType || !s.encoding || !s.compression);
  return flag;
});

const copyControl = (data: Partial<StorageDevice.MeasurementItem>) => !data.timeseries || !data.dataType || !data.encoding || !data.compression;
let lastQuery = '';

const remoteMethod = debounce((query: string) => {
  lastQuery = query;
  getDevice({
    groupName: props.groupName,
    keyword: lastQuery,
  }).then((res) => {
    if (lastQuery === query) {
      deviceList.value = res.data?.pathNames || [];
    }
  });
}, 500);

// 获取物理量
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getMeasurementList(val: string) {
  getMeasurementsInfosByFuzzy({
    dataBaseOrDevice: 'device',
    pathName: val,
    keyword: '',
    pageNum: 1,
    pageSize: 10,
  }).then((res) => {
    const data = res.data?.measurements?.map((item) => ({ ...item, isEditable: false }));
    data.forEach((item) => {
      formData.measurementList.unshift({ ...item });
    });
    activeName.value = `measurement_${formData.measurementList.length - 1}`;
  });
}

// 切换新建设备
function handleChangeAdd(val: CheckboxValueType) {
  formRef.value?.resetFields();
  formData.measurementList = [];
  formData.measurementList.push({
    deviceName: !val ? '' : `${props.groupName}`,
    timeseries: '',
    dataType: 'BOOLEAN',
    encoding: 'PLAIN',
    compression: 'SNAPPY',
    isEditable: true,
  });
  isAligned.value = false;
  nextTick(() => {
    activeName.value = 'measurement_0';
  });
}

// 复制
function handleCopyRow(data: Partial<StorageDevice.MeasurementItem>, e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  if (copyControl(data)) return;
  formData.measurementList.push({
    deviceName: data.deviceName,
    timeseries: `${data.timeseries}_copy`,
    dataType: data.dataType,
    encoding: data.encoding,
    compression: data.compression,
    isEditable: true,
  });
  nextTick(() => {
    activeName.value = `measurement_${formData.measurementList.length - 1}`;
  });
}

// 删除
function handleDelRow(i: number, e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  ElMessageBox.confirm('是否删除测点？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      if (formData.measurementList[i].isEditable) {
        formData.measurementList.splice(i, 1);
      } else {
        const deviceName = !addDevice.value ? formData.deviceName : `${props.groupName}.${formData.deviceName}`;
        deleteMeasurements([`${deviceName}.${formData.measurementList[i].timeseries}`]).then((res) => {
          if (res.code === 0) {
            ElMessage.success('删除成功');
            formData.measurementList.splice(i, 1);
          }
        });
      }
    });
}

// 设备是否对齐
function getDeviceAlign(val: string) {
  getIsAlignedDevice({
    deviceName: val,
  }).then((res) => {
    if (res.code === 0) {
      isAligned.value = res.data;
    }
  });
}

// 切换设备名
function handleChangeDevice(val: string) {
  formData.measurementList = [];
  getDeviceAlign(val);
  // getMeasurementList(val);
  formData.measurementList.push({
    deviceName: !addDevice.value ? formData.deviceName : `${props.groupName}.${formData.deviceName}`,
    timeseries: '',
    dataType: 'BOOLEAN',
    encoding: 'PLAIN',
    compression: 'SNAPPY',
    isEditable: true,
  });
  nextTick(() => {
    activeName.value = 'measurement_0';
  });
}

// 切换数据类型
function handleChangeRowDataType(val: string, item: Partial<StorageDevice.MeasurementItem>, index: number) {
  formData.measurementList.splice(index, 1, { ...item, encoding: encoding[val][0] as string as EncodingType });
}

// 追加行
function handleAddRow() {
  formData.measurementList.push({
    deviceName: !addDevice.value ? formData.deviceName : `${props.groupName}.${formData.deviceName}`,
    timeseries: '',
    dataType: 'BOOLEAN',
    encoding: 'PLAIN',
    compression: 'SNAPPY',
    isEditable: true,
  });
  nextTick(() => {
    activeName.value = `measurement_${formData.measurementList.length - 1}`;
  });
}

// 保存
const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      const deviceName = !addDevice.value ? formData.deviceName : `${props.groupName}.${formData.deviceName}`;
      const measurementDTOList = formData.measurementList.filter((f) => f.isEditable).map((item) => ({ ...item, deviceName }));
      saveMeasurementList({
        deviceName,
        measurementDTOList,
        isAligned: isAligned.value,
      }).then((res) => {
        if (res.code === 0) {
          ElMessage.success('创建成功！');
          dialogVisible.value = false;
          emit('handleSave');
        }
      });
    } else {
      ElMessage.error('请输入相应内容');
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formData.deviceName = '';
      formData.measurementList = [];
      addDevice.value = false;
      isAligned.value = false;
      formData.measurementList.push({
        deviceName: formData.deviceName,
        timeseries: '',
        dataType: 'BOOLEAN',
        encoding: 'PLAIN',
        compression: 'SNAPPY',
        isEditable: true,
      });
      remoteMethod('');
    }
  },
);

</script>

<style scoped lang="scss">
.module-title{
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: #495AD4;
  padding: 0 0 4px;
  border-bottom: 1px solid #F0F1FA;
}

.device-box{
  display: flex;
  align-items: center;

  .device-input-group{
    display: inline-flex;

    .device-input-prepend{
      cursor: default;

      :deep(.el-input__wrapper){
        border-radius: 2px 0 0 2px;
        margin-right: -1px;
      }

      :deep(.el-input__inner) {
        cursor: default;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .device-input-box{
      :deep(.el-input__wrapper){
        border-radius: 0 2px 2px 0;
      }
    }
  }
}

.measurement-list-box{
  // min-height: 152px;
  // max-height: 500px;
  // overflow-y: auto;
  border-bottom: none;

  :deep(.el-form-item--default) {
    margin-right: 9px;
  }

  :deep(.el-form-item__label) {
    padding-right: 4px;
  }
}

.collapse-title-box{
  height: 100%;
  width: calc(100% - 40px);

  .all-path-name{
    font-size: 14px;
    font-weight: 400;
    color: #424561;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    height: 100%;
  }
}

.device-operate{
  display: inline-flex;
}

.collapse-data-type-box{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #424561;

  .data-type-label{
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #656A85;
    margin-bottom: 2px;
  }
}

.operate-box{
  text-align: right;

  .el-button{
    min-width: 28px !important;
    padding: 0 !important;
  }
}
</style>
