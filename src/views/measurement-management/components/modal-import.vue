<template>
  <el-dialog
    title="批量导入物理量"
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
        <div class="select-item-box">
          <span class="select-item-label">模板下载：</span>
          <el-button v-if="false" link class="template-button" @click="downloadTemplate">moban.csv</el-button>
          <a href="/api/file/exportMeasurementTemplate" class="template-button" target="_blank">moban.csv</a>
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
            :on-exceed="handleExceed"
            :on-change="handleChange"
            :on-remove="handleRemove"
            :http-request="customUpload"
          >
            <el-icon size="80"><i-custom-upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                目前仅支持上传 csv 和 xlsx 文件
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
          <span class="error-tip" style="color: #D43030;">导入失败：文件与模板不符/数据信息有误</span>
          <el-button v-if="false" link style="color: #495AD4;text-decoration: underline;" @click="handleDownError">详情</el-button>
          <a :href="'/api/file/downloadMeasurementErrorInfo?fileName=' + uploadResult.filePath" class="error-link" target="_blank" rel="noopener noreferrer">详情</a>
        </div>

        <div class="partial-box" v-if="uploadStatus === 'partial'">
          <el-icon size="44"><i-custom-message-warning /></el-icon>
          <span class="error-tip">导入成功{{uploadResult.successNum}}条数据，导入失败{{uploadResult.failNum}}条数据</span>
          <el-button v-if="false" link class="error-link" @click="handleDownError">详情</el-button>
          <a :href="'/api/file/downloadMeasurementErrorInfo?fileName=' + uploadResult.filePath" class="error-link" target="_blank" rel="noopener noreferrer">详情</a>
        </div>
      </div>
    </div>

    <div class="m-t-10" style="text-align: right;" v-if="activeStep === 0">
      <el-button plain :disabled="!uploadFileInfo" @click="handleNext">下一步</el-button>
    </div>

    <div class="m-t-10" style="text-align: center;" v-if="activeStep === 2">
      <el-button type="primary" @click="handleClose">完成</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { genFileId } from 'element-plus';
import type {
  UploadInstance, UploadProps, UploadRawFile,
} from 'element-plus';
import { handleExport } from '@/utils/export';
import { StorageApi } from '@/api';

const props = defineProps<{
  serverId: number;
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (e: 'handle-close', reload: boolean): void;
}>();

const { requestFn: downloadMeasurementTemplate } = useRequest(StorageApi.downloadMeasurementTemplate);
const { requestFn: downloadMeasurementErrorInfo } = useRequest(StorageApi.downloadMeasurementErrorInfo);
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
  downloadMeasurementTemplate().then((res) => {
    if (res) {
      handleExport(res, 'moban.csv');
    }
  });
}

function handleDownError() {
  downloadMeasurementErrorInfo(uploadResult.filePath).then((res) => {
    if (res) {
      handleExport(res, uploadResult.filePath);
    }
  });
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
  }
}

.import-step-box{
  :deep(.el-step__title) {
    font-size: 14px;
    line-height: 21px;
  }

  :deep(.el-step__title.is-process) {
    color: #495AD4;
    font-weight: 700;
  }

  :deep(.el-step__title.is-wait) {
    color: #424561;
    font-weight: 700;
  }
}

.select-item-box{
  display: flex;
  margin: 10px 0;

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
  }
}

.select-result-box{
  width: 536px;
  height: 200px;
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
