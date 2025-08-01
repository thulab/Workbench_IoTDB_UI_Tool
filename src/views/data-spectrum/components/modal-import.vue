<template>
  <el-dialog :title="t('spectrum.importTitle')" v-model="dialogVisible" width="748px" class="new-storage-container" align-center :close-on-click-modal="false" id="measurement-modal-import">
    <div class="import-box">
      <el-steps :active="activeStep" align-center finish-status="success" class="import-step-box" id="measurement-import-steps">
        <el-step :title="t('common.chooseFile')">
          <template #title>{{ t('common.chooseFile') }}</template>
        </el-step>
        <el-step :title="t('common.fileImport')" />
        <el-step :title="t('common.importResult')" />
      </el-steps>

      <div class="select-file-box" v-if="activeStep === 0">
        <div class="select-item-box" style="align-items: center">
          <span class="select-item-label">{{ t('common.downloadTemplate') }}：</span>
          <a href="/api/file/downloadTemplate/PATTERN_MATCH" class="template-button" target="_blank">mode_template.csv</a>
        </div>
        <div class="select-item-box">
          <span class="select-item-label">{{ t('common.importFile') }}：</span>
          <el-upload
            ref="uploadRef"
            class="import-upload"
            drag
            :multiple="false"
            :limit="1"
            accept=".csv, .xlsx"
            :auto-upload="false"
            :before-upload="beforeUpload"
            :show-file-list="false"
            :on-exceed="handleExceed"
            :on-change="handleChange"
            :on-remove="handleRemove"
            :http-request="customUpload"
            id="measurement-import-upload"
          >
            <el-icon size="80" v-if="!uploadFileInfo"><i-custom-upload /></el-icon>
            <el-icon size="80" v-else><i-custom-file-info /></el-icon>
            <div class="file-info-box" v-if="uploadFileInfo">{{ uploadFileInfo.name }}</div>
            <div class="el-upload__text">
              {{ t('measurement.importMeasurementTip') }}
              <em>{{ !uploadFileInfo ? t('common.clickUpload') : t('common.clickReupload') }}</em>
            </div>
            <template #tip>
              <div class="el-upload__tip"></div>
            </template>
          </el-upload>
        </div>
      </div>

      <div class="select-result-box" v-if="activeStep === 1">
        <el-icon size="80"><i-custom-waiting /></el-icon>
        {{ t('common.uploading') }}…
      </div>

      <div class="select-result-box" v-if="activeStep === 2">
        <div class="success-box" v-if="uploadStatus === 'success'">
          <el-icon size="44"><i-custom-success-green /></el-icon>
          <span class="success-tip">{{ t('spectrum.importSuccessTip') }}</span>
        </div>

        <div class="error-box" v-if="uploadStatus === 'error'">
          <el-icon size="44"><i-custom-error /></el-icon>
          <span class="error-tip" style="color: #d43030">{{ t('spectrum.importFailedTip') }}</span>
          <a v-if="uploadResult.filePath" :href="`/api/file/downloadErrorInfo?fileName=${uploadResult.filePath}`" class="error-link" target="_self" rel="noopener noreferrer">
            {{ t('common.detail') }}
          </a>
        </div>

        <div class="partial-box" v-if="uploadStatus === 'partial'">
          <el-icon size="44"><i-custom-message-warning /></el-icon>
          <span class="error-tip">
            {{
              t(
                'spectrum.importedFailureStatus',
                { total: uploadResult.successNum + uploadResult.failNum, successNum: uploadResult.successNum, errorNum: uploadResult.failNum },
                uploadResult.successNum + uploadResult.failNum,
              )
            }}
          </span>
          <a v-if="uploadResult.filePath" :href="`/api/file/downloadErrorInfo?fileName=${uploadResult.filePath}`" class="error-link" target="_self" rel="noopener noreferrer">
            {{ t('common.detail') }}
          </a>
        </div>
      </div>

      <p class="error-info-tip" v-if="activeStep === 2 && (uploadStatus === 'error' || uploadStatus === 'partial')">{{ t('common.importTip') }}</p>
    </div>

    <div class="m-t-12 operate-buttons" style="text-align: right" v-if="activeStep === 0">
      <el-button type="primary" :disabled="!uploadFileInfo" @click="handleNext" id="measurement-import-next">{{ t('common.next') }}</el-button>
    </div>

    <div class="m-t-12 operate-buttons" style="height: 28px" v-if="activeStep === 1"></div>

    <div class="m-t-12 operate-buttons" style="text-align: center" v-if="activeStep === 2">
      <el-button type="primary" @click="handleClose" id="measurement-import-close">{{ t('common.finish') }}</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { genFileId } from 'element-plus';
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus';
import { SearchApi } from '@/api';
import type { ParsingMatchDataRes } from '@/types';

const props = defineProps<{
  visible: boolean;
  dataType: string;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (e: 'handle-close', times: string[], values: string[]): void;
}>();

const { requestFn: parsingPatternMatchData } = useRequest(SearchApi.parsingPatternMatchData);

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const uploadRef = ref<UploadInstance>();
const isCSV = ref(true);
const activeStep = ref(0);
const uploadFileInfo = ref<File>();
const uploadStatus = ref('');
const uploadResult = reactive<ParsingMatchDataRes>({
  status: true,
  successNum: 0,
  failNum: 0,
  filePath: '',
  errMsg: '',
  times: [],
  values: [],
});

const checkValid = (name: string) => {
  const suffix = name.split('.');
  const excelReg = /xlsx|csv/i;
  const csvReg = /csv/i;
  const isExcel = excelReg.test(suffix[suffix.length - 1]) && suffix.length > 1;
  isCSV.value = csvReg.test(suffix[suffix.length - 1]) && suffix.length > 1;
  return isExcel;
};

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isExcel = checkValid(rawFile.name);
  if (!isExcel) {
    ElMessage.error({ message: t('measurement.importMeasurementRule'), grouping: true });
    return false;
  }
  uploadFileInfo.value = rawFile;
  return true;
};
// 文件替换
const handleExceed: UploadProps['onExceed'] = (files) => {
  uploadRef.value!.clearFiles();
  const file = files[0] as UploadRawFile;
  file.uid = genFileId();
  uploadRef.value!.handleStart(file);
};
// 文件上传/替换
const handleChange: UploadProps['onChange'] = (uploadFile) => {
  uploadFileInfo.value = uploadFile.raw;
};
// 删除文件
const handleRemove: UploadProps['onRemove'] = () => {
  uploadFileInfo.value = undefined;
};
// 上传
const customUpload: UploadProps['httpRequest'] = (options) => {
  const formData = new FormData();
  formData.append('file', options.file);
  formData.append('dataType', props.dataType);
  return parsingPatternMatchData(formData, isCSV.value ? 'csv' : 'xlsx')
    .then((res) => {
      if (res.code === 0) {
        uploadResult.successNum = res.data.successNum;
        uploadResult.failNum = res.data.failNum;
        uploadResult.filePath = res.data.filePath;
        uploadResult.errMsg = res.data.errMsg;
        uploadResult.times = res.data.times;
        uploadResult.values = res.data.values;
        const { status } = res.data;
        if (!status || (!res.data.successNum && res.data.failNum > 0)) {
          uploadStatus.value = 'error';
        } else if (res.data.failNum > 0) {
          uploadStatus.value = 'partial';
        } else {
          uploadStatus.value = 'success';
        }
      }
      return res.data;
    })
    .finally(() => {
      activeStep.value = 2;
    });
};

function handleNext() {
  uploadRef.value!.submit();
  if (uploadFileInfo.value) {
    const isExcel = checkValid(uploadFileInfo.value?.name);
    if (!isExcel) return;
    nextTick(() => {
      activeStep.value = 1;
    });
  }
}

function handleClose() {
  dialogVisible.value = false;
  emit('handle-close', uploadResult.times, uploadResult.values);
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      activeStep.value = 0;
      uploadFileInfo.value = undefined;
      uploadStatus.value = '';
    }
  },
);
</script>

<style scoped lang="scss">
.new-storage-container {
  position: relative;

  .import-box {
    background-color: #f7f8fc;
    padding: 24px 16px;
    height: 332px;
    box-sizing: border-box;

    .file-info-box {
      font-size: 12px;
      font-weight: 400;
      line-height: 18px;
      color: #495ad4;
      margin-bottom: 20px;
      text-align: center;
    }
  }

  .operate-buttons {
    margin-bottom: -24px;
  }
}

.import-step-box {
  margin: 0 50px 18px;
}

.select-item-box {
  display: flex;
  margin: 20px 0;

  .select-item-label {
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #424561;
  }

  .template-button {
    color: #495ad4;
    text-decoration: underline;
  }

  .import-upload {
    flex: 1;

    :deep(.el-upload-dragger) {
      height: 180px;
      padding-top: 32px;

      .el-upload__text {
        font-size: 12px;
        font-weight: 400;
        line-height: 18px;
        color: #656a85;
      }
    }

    :deep(.el-upload__tip) {
      font-size: 12px;
      font-weight: 400;
      line-height: 18px;
      color: #656a85;
      margin-top: 4px;
    }
  }
}

.error-info-tip {
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #d43030;
  margin: 4px 74px 0;
}

.select-result-box {
  width: 536px;
  height: 180px;
  border-radius: 2px;
  background: #fff;
  border: 1px dashed #dfe1ed;
  margin: 58px auto 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #656a85;
}

.success-box,
.error-box,
.partial-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.success-tip {
  margin: 18px 0 0;
}

.error-tip {
  margin: 18px 0 28px;
}

.error-link {
  color: #495ad4;
  text-decoration: underline;
}
</style>
