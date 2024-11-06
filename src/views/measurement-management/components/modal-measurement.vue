<template>
  <el-dialog :title="t('measurement.newMeasurement')" v-model="dialogVisible" width="748px" :close-on-click-modal="false" id="measurement-modal-measurement">
    <el-form ref="formRef" :model="formData" label-position="left">
      <el-scrollbar :max-height="400" :min-height="152" class="measurement-list-box">
        <el-collapse accordion v-model="activeName">
          <el-collapse-item v-for="(item, index) in formData.measurementList" :key="index" :name="`measurement_${index}`">
            <template #title>
              <el-row class="collapse-title-box">
                <el-col :span="12">
                  <div class="all-path-name">{{ `${deviceName}.${item.timeseries}` }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="collapse-data-type-box">
                    <span class="data-type-label">{{ t('measurement.dataType') }}</span>
                    <span>{{ item.dataType }}</span>
                  </div>
                </el-col>
                <el-col :span="4">
                  <div class="operate-box">
                    <el-button link :disabled="existEmpty" @click="(e) => handleCopyRow(item, e)" :id="`measurement-modal-collapse-${index}-copy`" :class="existEmpty ? '' : 'svg-button-hover-color'">
                      <i-custom-copy />
                    </el-button>
                    <el-button link :class="['m-x-12', 'svg-button-hover-color']" @click="(e) => handleDelRow(index, e)" :id="`measurement-modal-collapse-${index}-del`">
                      <i-custom-delete />
                    </el-button>
                  </div>
                </el-col>
              </el-row>
            </template>
            <el-row>
              <el-col :span="24">
                <base-form-item
                  :label="`${t('measurement.measurementName')}：`"
                  :prop="`measurementList[${index}].timeseries`"
                  :rules="requiredRules"
                  class="m-r-0"
                  :label-width="locale === 'en' ? '108px' : '92px'"
                >
                  <div class="measurement-name-box">
                    <div class="measurement-input-group">
                      <el-input :value="`${deviceName}.`" disabled class="measurement-input-prepend" style="width: 128px" id="measurement-modal-input-deviceName" />
                      <el-input
                        v-model="item.timeseries"
                        :placeholder="t('measurement.measurementNamePlaceholder')"
                        class="measurement-input-box"
                        :id="`measurement-modal-collapse-${index}-timeseries`"
                      />
                    </div>
                    <div class="measurement-operate">
                      <el-checkbox v-model="item.isAligned" :label="t('measurement.deviceAlign')" :id="`measurement-modal-collapse-${index}-isAligned`" />
                    </div>
                  </div>
                </base-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <base-form-item :prop="`measurementList[${index}].description`" class="m-r-0 el-form-item-not-mandatory" :label-width="locale === 'en' ? '108px' : '92px'">
                  <template #label>{{ t('measurement.measurementAlias') }}：</template>
                  <el-input v-model="item.alias" :placeholder="t('measurement.aliasPlaceholder')" :id="`measurement-modal-collapse-${index}-description`" maxlength="100" show-word-limit />
                </base-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <base-form-item :prop="`measurementList[${index}].description`" class="m-r-0 el-form-item-not-mandatory" :label-width="locale === 'en' ? '108px' : '92px'">
                  <template #label>
                    {{ t('measurement.measurementDescription') }}：
                    <el-tooltip effect="light" :content="t('measurement.descriptionTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                  </template>
                  <el-input
                    v-model="item.description"
                    :placeholder="t('measurement.measurementDescriptionPlaceholder')"
                    :id="`measurement-modal-collapse-${index}-description`"
                    maxlength="100"
                    show-word-limit
                  />
                </base-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <base-form-item :prop="`measurementList[${index}].description`" class="m-r-0 el-form-item-not-mandatory" :label-width="locale === 'en' ? '108px' : '92px'">
                  <template #label>
                    {{ t('measurement.tag') }}：
                    <el-tooltip effect="light" :content="t('measurement.tagTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
                  </template>
                  <el-input v-model="item.tags" :placeholder="t('measurement.tagPlaceholder')" :id="`measurement-modal-collapse-${index}-description`" maxlength="100" show-word-limit />
                </base-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="8">
                <base-form-item :label="`${t('measurement.dataType')}：`" :prop="`measurementList[${index}].dataType`" :rules="requiredRules">
                  <el-select v-model="item.dataType" @change="(val) => handleChangeRowDataType(val, item, index)" :id="`measurement-modal-collapse-${index}-dataType`">
                    <el-option v-for="dtype in dataTypeOptions" :key="dtype" :label="dtype" :value="dtype" :id="`measurement-modal-collapse-${index}-dataType-select-${dtype}`" />
                  </el-select>
                </base-form-item>
              </el-col>
              <el-col :span="8">
                <base-form-item :label="`${t('measurement.encoding')}：`" :prop="`measurementList[${index}].encoding`" :rules="requiredRules">
                  <el-select v-model="item.encoding" :disabled="!item.dataType" :id="`measurement-modal-collapse-${index}-encoding`">
                    <el-option v-for="enc in encodingOptions(item.dataType as string)" :key="enc" :label="enc" :value="enc" :id="`measurement-modal-collapse-${index}-encoding-select-${enc}`" />
                  </el-select>
                </base-form-item>
              </el-col>
              <el-col :span="8">
                <base-form-item :label="`${t('measurement.compression')}：`" :prop="`measurementList[${index}].compression`" :rules="requiredRules" style="margin-right: 0">
                  <el-select v-model="item.compression" :id="`measurement-modal-collapse-${index}-compression`">
                    <el-option v-for="com in compressionOptions" :key="com" :label="com" :value="com" :id="`measurement-modal-collapse-${index}-compression-select-${com}`" />
                  </el-select>
                </base-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-scrollbar>

      <el-button style="width: 100%" :class="['m-t-16', existEmpty ? '' : 'svg-button-hover-color']" :disabled="existEmpty" @click="handleAddRow" id="measurement-modal-collapse-add">
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
import type { FormInstance } from 'element-plus';
import { StorageApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const props = defineProps<{
  visible: boolean;
  deviceName: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', path: string): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const activeName = ref('measurement_0');
const { t, locale } = useI18n();
const { requestFn: insertMeasurements, loading: saveLoading } = useRequest(StorageApi.insertMeasurements);

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
const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: 'blur',
  },
]);
const formData = reactive<{
  measurementList: Array<Partial<StorageDevice.MeasurementItem>>;
}>({
  measurementList: [],
});

const existEmpty = computed(() => {
  const flag = formData.measurementList.some((s) => !s.timeseries || !s.dataType || !s.encoding || !s.compression);
  return flag;
});

const copyControl = (data: Partial<StorageDevice.MeasurementItem>) => !data.timeseries || !data.dataType || !data.encoding || !data.compression;

// 复制
function handleCopyRow(data: Partial<StorageDevice.MeasurementItem>, e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  if (copyControl(data)) return;
  formData.measurementList.push({
    // deviceName: data.deviceName,
    timeseries: `${data.timeseries}_copy`,
    isAligned: data.isAligned,
    description: '',
    dataType: data.dataType,
    encoding: data.encoding,
    compression: data.compression,
  });
  nextTick(() => {
    activeName.value = `measurement_${formData.measurementList.length - 1}`;
  });
}

// 删除
function handleDelRow(i: number, e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  ElMessageBox.confirm(`${t('measurement.deleteMeasurementSingle')}`, t('common.notice'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    confirmButtonClass: 'measurement-modal-collapse-del-confirm',
    cancelButtonClass: 'measurement-modal-collapse-del-cancel',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    formData.measurementList.splice(i, 1);
  });
}

// 切换数据类型
function handleChangeRowDataType(val: string, item: Partial<StorageDevice.MeasurementItem>, index: number) {
  formData.measurementList.splice(index, 1, { ...item, encoding: encoding[val][0] as string as EncodingType });
}

// 追加行
function handleAddRow() {
  formData.measurementList.push({
    // deviceName: `${props.deviceName}`,
    timeseries: '',
    isAligned: false,
    description: '',
    dataType: 'BOOLEAN',
    encoding: 'PLAIN',
    compression: 'SNAPPY',
  });
  nextTick(() => {
    activeName.value = `measurement_${formData.measurementList.length - 1}`;
  });
}

// 保存
const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      // const measurementVOList = formData.measurementList.map((item) => ({ ...item, deviceName: props.deviceName }));
      const measurementVOList = formData.measurementList.map((item) => ({ ...item, timeseries: `${props.deviceName}.${item.timeseries}` }));
      insertMeasurements({
        measurements: measurementVOList,
      })
        .then((res) => {
          if (res.code === 0) {
            ElMessage.success({ message: `${t('common.createSuccess')}`, grouping: true });
            dialogVisible.value = false;
            emit('handleSave', measurementVOList[0].timeseries);
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
                emit('handleSave', measurementVOList[0].timeseries);
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
      formData.measurementList = [];
      formData.measurementList.push({
        // deviceName: props.deviceName,
        timeseries: '',
        isAligned: false,
        description: '',
        dataType: 'BOOLEAN',
        encoding: 'PLAIN',
        compression: 'SNAPPY',
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

.measurement-name-box {
  display: flex;
  align-items: center;
  width: 100%;

  .measurement-input-group {
    flex: 1;
    display: flex;

    .measurement-input-prepend {
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

    .measurement-input-box {
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
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    height: 100%;
    text-align: left;
  }
}

.measurement-operate {
  margin: 0 16px 0 24px;
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
