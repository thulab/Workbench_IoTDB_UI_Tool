<template>
  <el-dialog :title="t('measurement.newMeasurement')" v-model="dialogVisible" width="748px" :close-on-click-modal="false" id="measurement-modal-measurement">
    <el-form ref="formRef" :model="formData" label-position="left">
      <h4 class="module-title">{{ t('measurement.device') }}</h4>
      <el-form-item :label="`${t('measurement.deviceName')}：`" prop="deviceName" class="p-t-8" :rules="!addDevice ? requiredRules : deviceRules">
        <el-input type="hidden" />
        <div class="device-box">
          <el-select
            v-if="!addDevice"
            v-model="formData.deviceName"
            :placeholder="t('measurement.deviceNameSelectPlaceholder')"
            filterable
            remote
            remote-show-suffix
            :remote-method="remoteMethod"
            style="width: 300px"
            @change="handleChangeDevice"
            id="measurement-modal-select-device"
          >
            <el-option v-for="item in deviceList" :key="item" :label="item" :value="item" :id="`measurement-modal-select-device-select-${item}`">
              <div style="display: flex; width: 260px">
                <text-tooltip :content="item" />
              </div>
            </el-option>
          </el-select>
          <div v-else class="device-input-group">
            <el-input :value="`${groupName}.`" disabled class="device-input-prepend" style="width: 130px" id="measurement-modal-input-groupName" />
            <el-input v-model="formData.deviceName" :placeholder="t('measurement.deviceNameInputPlaceholder')" class="device-input-box" style="width: 170px" id="measurement-modal-input-deviceName" />
          </div>

          <div class="device-operate m-l-12">
            <el-checkbox v-model="addDevice" :label="t('measurement.newDevice')" @change="handleChangeAdd" id="measurement-modal-checkbox-device-add" />
            <el-checkbox v-model="isAligned" :label="t('measurement.deviceAlign')" :disabled="!addDevice" id="measurement-modal-checkbox-device-align" />
          </div>
        </div>
      </el-form-item>
      <h4 class="module-title" style="border: none">{{ t('measurement.measurement') }}</h4>
      <el-scrollbar :max-height="400" :min-height="152" class="measurement-list-box">
        <el-collapse accordion v-model="activeName">
          <el-collapse-item v-for="(item, index) in formData.measurementList" :key="index" :name="`measurement_${index}`">
            <template #title>
              <el-row class="collapse-title-box">
                <el-col :span="12">
                  <div v-if="formData.deviceName" class="all-path-name">{{ !addDevice ? `${formData.deviceName}.${item.timeseries}` : `${groupName}.${formData.deviceName}.${item.timeseries}` }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="collapse-data-type-box">
                    <span class="data-type-label">{{ t('measurement.dataType') }}</span>
                    <span>{{ item.dataType }}</span>
                  </div>
                </el-col>
                <el-col :span="4">
                  <div class="operate-box">
                    <el-button
                      link
                      :disabled="!formData.deviceName || addControl"
                      @click="(e) => handleCopyRow(item, e)"
                      :id="`measurement-modal-collapse-${index}-copy`"
                      :class="!formData.deviceName || addControl ? '' : 'svg-button-hover-color'"
                    >
                      <i-custom-copy />
                    </el-button>
                    <el-button
                      link
                      :disabled="!formData.deviceName"
                      :class="['m-x-12', !formData.deviceName ? '' : 'svg-button-hover-color']"
                      @click="(e) => handleDelRow(index, e)"
                      :id="`measurement-modal-collapse-${index}-del`"
                    >
                      <i-custom-delete />
                    </el-button>
                  </div>
                </el-col>
              </el-row>
            </template>
            <el-row>
              <el-col :span="24">
                <el-form-item
                  :label="`${t('measurement.measurementName')}：`"
                  :prop="`measurementList[${index}].timeseries`"
                  :rules="requiredRules"
                  class="m-r-0"
                  :label-width="locale === 'en' ? '198px' : '92px'"
                >
                  <el-input type="hidden" />
                  <el-input
                    v-model="item.timeseries"
                    :placeholder="t('measurement.measurementNamePlaceholder')"
                    :disabled="!item.isEditable || !formData.deviceName"
                    :id="`measurement-modal-collapse-${index}-timeseries`"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :prop="`measurementList[${index}].description`" class="m-r-0 el-form-item-not-mandatory" :label-width="locale === 'en' ? '198px' : '92px'">
                  <template #label>
                    {{ t('measurement.measurementDescription') }}：
                    <el-tooltip effect="light" :content="t('measurement.descriptionTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                  </template>
                  <el-input type="hidden" />
                  <el-input
                    v-model="item.description"
                    :placeholder="t('measurement.measurementDescriptionPlaceholder')"
                    :disabled="!item.isEditable || !formData.deviceName"
                    :id="`measurement-modal-collapse-${index}-description`"
                    maxlength="100"
                    show-word-limit
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="8">
                <el-form-item :label="`${t('measurement.dataType')}：`" :prop="`measurementList[${index}].dataType`" :rules="requiredRules">
                  <el-input type="hidden" />
                  <el-select
                    v-model="item.dataType"
                    @change="(val) => handleChangeRowDataType(val, item, index)"
                    :disabled="!item.isEditable || !formData.deviceName"
                    :id="`measurement-modal-collapse-${index}-dataType`"
                  >
                    <el-option v-for="dtype in dataTypeOptions" :key="dtype" :label="dtype" :value="dtype" :id="`measurement-modal-collapse-${index}-dataType-select-${dtype}`" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="`${t('measurement.encoding')}：`" :prop="`measurementList[${index}].encoding`" :rules="requiredRules">
                  <el-input type="hidden" />
                  <el-select v-model="item.encoding" :disabled="!item.isEditable || !item.dataType || !formData.deviceName" :id="`measurement-modal-collapse-${index}-encoding`">
                    <el-option v-for="enc in encodingOptions(item.dataType as string)" :key="enc" :label="enc" :value="enc" :id="`measurement-modal-collapse-${index}-encoding-select-${enc}`" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="`${t('measurement.compression')}：`" :prop="`measurementList[${index}].compression`" :rules="requiredRules" style="margin-right: 0">
                  <el-input type="hidden" />
                  <el-select v-model="item.compression" :disabled="!item.isEditable || !formData.deviceName" :id="`measurement-modal-collapse-${index}-compression`">
                    <el-option v-for="com in compressionOptions" :key="com" :label="com" :value="com" :id="`measurement-modal-collapse-${index}-compression-select-${com}`" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-scrollbar>

      <el-button style="width: 100%" :class="['m-t-16', addControl ? '' : 'svg-button-hover-color']" :disabled="addControl" @click="handleAddRow" id="measurement-modal-collapse-add">
        <i-custom-add class="m-r-4" />
        {{ t('measurement.addMeasurement') }}
      </el-button>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="measurement-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" id="measurement-modal-confirm">{{ t('common.confirm') }}</el-button>
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
  (event: 'handleSave'): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const activeName = ref('measurement_0');
const { t, locale } = useI18n();
const { requestFn: getDevice } = useRequest(StorageApi.getDeviceByGroup);
const { requestFn: getMeasurementsInfosByFuzzy } = useRequest(StorageApi.getMeasurementsInfosByFuzzy);
const { requestFn: getIsAlignedDevice } = useRequest(StorageApi.getIsAlignedDevice);
const { requestFn: saveMeasurementList, loading: saveLoading } = useRequest(StorageApi.saveMeasurementList);
const { requestFn: deleteMeasurements } = useRequest(StorageApi.deleteMeasurements);

const dataTypeOptions = ['BOOLEAN', 'INT32', 'INT64', 'FLOAT', 'DOUBLE', 'TEXT'];
const encoding: { [key: string]: string[] } = {
  BOOLEAN: ['PLAIN', 'RLE'],
  INT32: ['RLE', 'PLAIN', 'TS_2DIFF', 'GORILLA', 'ZIGZAG', 'CHIMP', 'SPRINTZ', 'RLBE'],
  INT64: ['RLE', 'PLAIN', 'TS_2DIFF', 'GORILLA', 'ZIGZAG', 'CHIMP', 'SPRINTZ', 'RLBE'],
  FLOAT: ['GORILLA', 'PLAIN', 'RLE', 'TS_2DIFF', 'CHIMP', 'SPRINTZ', 'RLBE'],
  DOUBLE: ['GORILLA', 'PLAIN', 'RLE', 'TS_2DIFF', 'CHIMP', 'SPRINTZ', 'RLBE'],
  TEXT: ['PLAIN', 'DICTIONARY'],
};
const compressionOptions = ['UNCOMPRESSED', 'SNAPPY', 'LZ4', 'GZIP', 'ZSTD', 'LZMA2'];

const encodingOptions = computed(() => (val: string) => encoding[val]);

const formRef = ref<FormInstance>();
const deviceRules = ref([
  {
    required: true,
    message: () => t('measurement.deviceRuleEmptyTip'),
    trigger: ['blur', 'change'],
  },
  {
    pattern: /^`.*`$|^(["'.a-zA-Z0-9_\u4e00-\u9fa5]*)$/,
    message: () => t('measurement.deviceRuleTip'),
    trigger: 'blur',
  },
]);
const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
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
    description: '',
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
    description: '',
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
  ElMessageBox.confirm(`${t('measurement.deleteMeasurementSingle')}？`, t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'measurement-modal-collapse-del-confirm',
    cancelButtonClass: 'measurement-modal-collapse-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    if (formData.measurementList[i].isEditable) {
      formData.measurementList.splice(i, 1);
    } else {
      const deviceName = !addDevice.value ? formData.deviceName : `${props.groupName}.${formData.deviceName}`;
      deleteMeasurements([`${deviceName}.${formData.measurementList[i].timeseries}`]).then((res) => {
        if (res.code === 0) {
          ElMessage.success({ message: t('common.deleteSuccess'), grouping: true });
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
    description: '',
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
    description: '',
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
      const measurementVOList = formData.measurementList.filter((f) => f.isEditable).map((item) => ({ ...item, deviceName }));
      saveMeasurementList({
        deviceName,
        measurementVOList,
        isAligned: isAligned.value,
      })
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success({ message: `${t('common.createSuccess')}`, grouping: true });
            dialogVisible.value = false;
            emit('handleSave');
          }
        })
        .catch((err) => {
          if (err.code === 9999 || err.code === 1380) {
            ElMessageBox.confirm(err.message, t('common.error'), {
              confirmButtonText: t('common.confirm'),
              cancelButtonText: t('common.cancel'),
              confirmButtonClass: 'save-measurement-error-confirm',
              cancelButtonClass: 'save-measurement-error-cancel',
              type: 'error',
            }).finally(() => {
              if (err.code === 9999) {
                dialogVisible.value = false;
                emit('handleSave');
              }
            });
          }
        });
    } else {
      ElMessage.error({ message: t('common.formRuleEmptyOperateShort'), grouping: true });
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
        description: '',
        dataType: 'BOOLEAN',
        encoding: 'PLAIN',
        compression: 'SNAPPY',
        isEditable: true,
      });
    }
  }
);
</script>

<style scoped lang="scss">
.module-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: #495ad4;
  padding: 0 0 4px;
  border-bottom: 1px solid #f0f1fa;
}

.device-box {
  display: flex;
  align-items: center;

  .device-input-group {
    display: inline-flex;

    .device-input-prepend {
      cursor: default;

      :deep(.el-input__wrapper) {
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

    .device-input-box {
      :deep(.el-input__wrapper) {
        border-radius: 0 2px 2px 0;
      }
    }
  }
}

.measurement-list-box {
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

.collapse-title-box {
  height: 100%;
  width: calc(100% - 40px);

  .all-path-name {
    font-size: 14px;
    font-weight: 400;
    color: #424561;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    height: 100%;
    text-align: left;
  }
}

.device-operate {
  display: inline-flex;
}

.collapse-data-type-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #424561;

  .data-type-label {
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #656a85;
    margin-bottom: 2px;
  }
}

.operate-box {
  text-align: right;

  .el-button {
    min-width: 28px !important;
    padding: 0 !important;
  }
}
</style>
