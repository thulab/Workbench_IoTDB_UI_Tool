<template>
  <el-dialog
    title="批量导入测点"
    v-model="dialogVisible"
    width="748px"
    class="new-storage-container"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="import-box">
      <el-steps :active="activeStep" align-center finish-status="success" class="import-step-box">
        <el-step title="选择文件">
          <template #title>选择文件</template>
        </el-step>
        <el-step title="文件导入" />
        <el-step title="导入结果" />
      </el-steps>

      <div class="select-file-box" v-if="activeStep === 0">
        <div class="select-item-box" style="align-items: center;">
          <span class="select-item-label">模板下载：</span>
          <el-button v-if="false" link class="template-button" @click="downloadTemplate">timeseries_template.csv</el-button>
          <a href="/api/file/exportMeasurementTemplate" class="template-button" target="_blank">timeseries_template.csv</a>
        </div>
        <div class="select-item-box">
          <span class="select-item-label">导入文件：</span>
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
          >
            <el-icon size="80" v-if="!uploadFileInfo"><i-custom-upload /></el-icon>
            <el-icon size="80" v-else><i-custom-file-info /></el-icon>
            <div class="file-info-box" v-if="uploadFileInfo">{{ uploadFileInfo.name }}</div>
            <div class="el-upload__text">
              将文件拖到此处，或<em>{{!uploadFileInfo ? '点击上传' : '点击重新上传' }}</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持上传 csv 和 xlsx 文件
              </div>
            </template>
          </el-upload>
        </div>
      </div>

      <div class="select-result-box" v-if="activeStep === 1">
        <el-icon size="80"><i-custom-waiting /></el-icon>
        文件导入中…
      </div>

      <div class="select-result-box" v-if="activeStep === 2">
        <div class="success-box" v-if="uploadStatus === 'success'">
          <el-icon size="44"><i-custom-success-green /></el-icon>
          <span class="success-tip">导入成功！共{{uploadResult.successNum}}条数据</span>
        </div>

        <div class="error-box" v-if="uploadStatus === 'error'">
          <el-icon size="44"><i-custom-error /></el-icon>
          <span class="error-tip" style="color: #D43030;">{{uploadResult.errMsg}}</span>
          <el-button v-if="false" link style="color: #495AD4;text-decoration: underline;" @click="handleDownError">详情</el-button>
          <a v-if="uploadResult.filePath" :href="'/api/file/downloadMeasurementErrorInfo?fileName=' + uploadResult.filePath" class="error-link" target="_self" rel="noopener noreferrer">详情</a>
        </div>

        <div class="partial-box" v-if="uploadStatus === 'partial'">
          <el-icon size="44"><i-custom-message-warning /></el-icon>
          <span class="error-tip">导入成功{{uploadResult.successNum}}条数据，导入失败{{uploadResult.failNum}}条数据</span>
          <el-button v-if="false" link class="error-link" @click="handleDownError">详情</el-button>
          <a v-if="uploadResult.filePath" :href="'/api/file/downloadMeasurementErrorInfo?fileName=' + uploadResult.filePath" class="error-link" target="_self" rel="noopener noreferrer">详情</a>
        </div>
      </div>
    </div>

    <div class="m-t-12" style="text-align: right;" v-if="activeStep === 0">
      <el-button plain :disabled="!uploadFileInfo" @click="handleNext">下一步</el-button>
    </div>

    <div class="m-t-12" style="height: 28px;" v-if="activeStep === 1"></div>

    <div class="m-t-12" style="text-align: center;" v-if="activeStep === 2">
      <el-button type="primary" @click="handleClose">完成</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { genFileId } from 'element-plus';
import type {
  UploadInstance, UploadProps, UploadRawFile,
} from 'element-plus';
import { StorageApi } from '@/api';

const props = defineProps<{
  serverId: number;
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (e: 'handle-close', reload: boolean): void;
}>();

const { requestFn: importMeasurementData } = useRequest(StorageApi.importMeasurementData);

const dialogVisible = useVModel(props, 'visible', emit);
const uploadRef = ref<UploadInstance>();
const isCSV = ref(true);
const activeStep = ref(0);
const uploadFileInfo = ref<File>();
const uploadStatus = ref('');
const uploadResult = reactive({
  successNum: 0,
  failNum: 0,
  filePath: '',
  errMsg: '',
});

// 下载模板
function downloadTemplate() {
  window.open('/api/file/exportMeasurementTemplate');
}

function handleDownError() {
  window.open(`/api/file/downloadMeasurementErrorInfo?fileName=${uploadResult.filePath}`);
}

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
    ElMessage.error('文件格式不正确，目前仅支持上传.csv和.xlsx文件');
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
  return importMeasurementData(props.serverId, formData, isCSV.value ? 'csv' : 'xlsx').then(((res) => {
    if (res.code === 0) {
      uploadResult.successNum = res.data.successNum;
      uploadResult.failNum = res.data.failNum;
      uploadResult.filePath = res.data.filePath;
      uploadResult.errMsg = res.data.errMsg;
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
  })).finally(() => {
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
  emit('handle-close', uploadStatus.value === 'success' || uploadStatus.value === 'partial');
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

.new-storage-container{
  position: relative;

  .import-box{
    background-color: #F7F8FC;
    padding: 24px 16px;
    height: 332px;
    box-sizing: border-box;

    .file-info-box{
      font-size: 12px;
      font-weight: 400;
      line-height: 18px;
      color: #495AD4;
      margin-bottom: 20px;
      text-align: center;
    }
  }
}

.import-step-box{
  margin: 0 50px 18px;
}

.select-item-box{
  display: flex;
  margin: 20px 0;

  .select-item-label{
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #424561;
  }

  .template-button{
    color: #495AD4;
    text-decoration: underline;
  }

  .import-upload{
    flex: 1;

    :deep(.el-upload-dragger) {
      height: 180px;
      padding-top: 32px;

      .el-upload__text{
        font-size: 12px;
        font-weight: 400;
        line-height: 18px;
        color: #656A85;
      }
    }

    :deep(.el-upload__tip) {
      font-size: 12px;
      font-weight: 400;
      line-height: 18px;
      color: #656A85;
      margin-top: 4px;
    }
  }
}

.select-result-box{
  width: 536px;
  height: 180px;
  border-radius: 2px;
  background: #FFF;
  border: 1px dashed #DFE1ED;
  margin: 58px auto 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #656A85;
}

.success-box, .error-box, .partial-box{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.success-tip{
  margin: 18px 0 0;
}

.error-tip{
  margin: 18px 0 28px;
}

.error-link{
  color: #495AD4;
  text-decoration: underline;
}
</style>
