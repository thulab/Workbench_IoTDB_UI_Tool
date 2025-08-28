<template>
  <el-dialog :title="t('search.batchImportData')" v-model="dialogVisible" width="748px" class="new-storage-container" align-center :close-on-click-modal="false" id="data-search-modal-import">
    <div class="import-box">
      <el-steps :active="activeStep" align-center finish-status="success" class="import-step-box" id="data-search-import-steps">
        <el-step :title="t('common.chooseFile')">
          <template #title>{{ t('common.chooseFile') }}</template>
        </el-step>
        <el-step :title="t('common.fileImport')" />
        <el-step :title="t('common.importResult')" />
      </el-steps>

      <div class="select-file-box" v-if="activeStep === 0">
        <div class="select-item-box" style="align-items: center">
          <span class="select-item-label">{{ t('common.importFormat') }}：</span>
          <el-radio-group v-model="importFormat" :disabled="uploadFileInfos && uploadFileInfos?.length > 0">
            <el-radio :value="0">TsFile</el-radio>
            <el-radio :value="1">CSV</el-radio>
            <el-radio :value="2">XLSX</el-radio>
          </el-radio-group>
        </div>
        <div v-if="importFormat !== 0" class="select-item-box m-b-10" style="align-items: center">
          <span class="select-item-label">{{ t('common.downloadTemplate') }}：</span>
          <a href="/api/file/importDataTemplate" class="template-button" target="_blank">data _template.csv</a>
        </div>
        <div class="select-item-box">
          <span class="select-item-label" :style="{ opacity: !uploadFileInfos || uploadFileInfos?.length === 0 ? 1 : 0 }">{{ t('common.importFile') }}：</span>
          <el-upload
            ref="uploadRef"
            class="import-upload"
            :class="{ 'non-tsfile': importFormat !== 0 }"
            drag
            multiple
            :limit="20"
            v-model:file-list="uploadFileInfos"
            :accept="accept"
            :auto-upload="false"
            :before-upload="beforeUpload"
            :show-file-list="false"
            :on-exceed="handleExceed"
            :on-change="handleChange"
            :on-remove="handleRemove"
            :http-request="customUpload"
            id="data-search-import-upload"
          >
            <el-icon class="m-t-32" size="80" v-if="!uploadFileInfos || uploadFileInfos?.length === 0"><i-custom-upload /></el-icon>
            <div class="upload-file-list-wrapper" v-else>
              <h4 class="upload-title">
                {{ t('common.importFile') }}:
                <!-- <span class="sub-info">（{{ uploadFileInfos?.length || 0 }}/20{{ t('measurement.importingStatus') }}）</span> -->
              </h4>

              <div class="upload-info-box">
                <ul class="upload-info-list">
                  <li v-for="file in uploadFileInfos" :key="file.uid" class="upload-info-item">
                    <div style="display: inline-flex; width: 480px"><text-tooltip :content="file.name" /></div>
                    <!-- 右侧增加删除 icon -->
                    <div class="item-delete-box" :id="`upload-${file.uid}-del`" @click="(e) => handleRemoveClick(file, e)">
                      <i-custom-delete class="item-delete" />
                      <i-custom-delete-active class="item-delete-active" />
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div class="el-upload__text" :class="{ 'non-tsfile': uploadFileInfos && uploadFileInfos?.length > 0 }">
              {{ t('measurement.importDataTip') }}
              <em>{{ t('common.clickUpload') }}</em>
            </div>
            <template #tip>
              <div class="el-upload__tip"></div>
            </template>
          </el-upload>
        </div>
      </div>

      <div class="select-result-box" v-if="activeStep === 1">
        <div class="upload-file-list-wrapper">
          <h4 class="upload-title">
            {{ t('common.importFile') }}:
            <span class="sub-info">（{{ uploadResult.successNum + uploadResult.failNum }}/{{ uploadFileInfos?.length || 0 + t('measurement.importingStatus') }}）</span>
          </h4>

          <div class="upload-info-box">
            <ul class="upload-info-list">
              <li v-for="uploadItem in uploadDetail" :key="uploadItem.file.uid" class="upload-info-item">
                <div style="display: inline-flex; width: 280px"><text-tooltip :content="uploadItem.file.name" /></div>
                <div class="item-box">
                  <upload-icon :status="uploadItem.uploadStatus" type="upload" />
                  <upload-icon class="m-l-16" :status="uploadItem.importStatus" type="import" />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="select-result-box" v-if="activeStep === 2 && uploadResult.successNum === uploadDetail.length">
        <div class="success-box">
          <el-icon size="44"><i-custom-success-green /></el-icon>
          <span class="success-tip">{{ t('measurement.importedSuccessStatus', { total: uploadDetail.length, success: uploadResult.successNum }, uploadDetail.length) }}</span>
        </div>
      </div>
      <div class="upload-result-box" v-else-if="activeStep === 2">
        <p>{{ t('measurement.importedFailureStatus', { total: uploadDetail.length, success: uploadResult.successNum, failure: uploadResult.failNum }, uploadDetail.length) }}</p>
        <el-table class="upload-result-table" :data="uploadDetail" style="width: 100%" size="small" max-height="210">
          <el-table-column type="index" :label="t('measurement.num')" width="60" align="center" />
          <el-table-column prop="file.name" :label="t('measurement.fileName')" show-overflow-tooltip width="400" />
          <el-table-column prop="importStatus" :label="t('common.status')" width="60" align="center">
            <template #default="{ row }">
              <span v-if="row.importStatus === 2">{{ t('common.success') }}</span>
              <a v-else-if="row.importResp?.filePath" :href="`/api/file/downloadErrorInfo?fileName=${row.importResp?.filePath}`" class="error-link" target="_self" rel="noopener noreferrer">
                {{ t('common.fail') }}
              </a>
              <el-popover v-else trigger="click" :content="row.failedReason" :width="350">
                <template #reference>
                  <el-button link type="primary">{{ t('common.fail') }}</el-button>
                </template>
              </el-popover>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <p class="error-info-tip" v-if="activeStep === 2 && (uploadStatus === 'error' || uploadStatus === 'partial')">{{ t('common.importTip') }}</p>
    </div>

    <div class="m-t-12 operate-buttons" style="text-align: right" v-if="activeStep === 0">
      <el-button type="primary" :disabled="!uploadFileInfos || uploadFileInfos.length === 0" @click="handleNext" id="data-search-import-next">{{ t('common.next') }}</el-button>
    </div>

    <div class="m-t-12 operate-buttons" style="height: 28px" v-if="activeStep === 1"></div>

    <div class="m-t-12 operate-buttons" style="text-align: center" v-if="activeStep === 2">
      <el-button type="primary" @click="handleClose" id="data-search-import-close">{{ t('common.finish') }}</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus';
import { SearchApi } from '@/api';
import type { UploadFileStatus } from '@/types';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (e: 'handle-close', reload: boolean): void;
}>();

const { requestFn: upload } = useRequest(SearchApi.upload, { errMessage: false });
const { requestFn: importFile } = useRequest(SearchApi.importFile, { errMessage: false });

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const uploadRef = ref<UploadInstance>();
const importFormat = ref(0);
const accept = computed(() => {
  if (importFormat.value === 0) return '.tsfile';
  if (importFormat.value === 1) return '.csv';
  if (importFormat.value === 2) return '.xlsx';
  return '.tsfile';
});
const activeStep = ref(0);
const uploadFileInfos = ref<UploadRawFile[]>();
const uploadStatus = ref('');
const uploadDetail = ref<Array<UploadFileStatus<UploadRawFile>>>([]);
const uploadResult = reactive({
  successNum: 0,
  failNum: 0,
  filePath: '',
  errMsg: '',
});

const checkValid = (name: string) => name.toLocaleLowerCase().endsWith(accept.value);

const beforeUpload: UploadProps['beforeUpload'] = () => true;

// 文件替换
const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning(t('measurement.importDataRule'));
};
// 文件上传/替换
const handleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  const isValid = checkValid(uploadFile.name);
  if (!isValid) {
    ElMessage.error({ message: t('measurement.importDataRule2'), grouping: true });
    uploadFiles.splice(uploadFiles.indexOf(uploadFile), 1);
  }
};
// 删除文件
const handleRemove: UploadProps['onRemove'] = (file) => {
  const findItem = uploadFileInfos.value?.find((item) => item.uid === file.uid);
  if (findItem) {
    uploadFileInfos.value?.splice(uploadFileInfos.value.indexOf(findItem), 1);
  }
};
const handleRemoveClick = (file: UploadRawFile, e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const findItem = uploadFileInfos.value?.find((item) => item.uid === file.uid);
  if (findItem) {
    uploadFileInfos.value?.splice(uploadFileInfos.value.indexOf(findItem), 1);
  }
};
const canNext = () => {
  if (uploadDetail.value?.every((item) => item.importStatus !== 0 && item.importStatus !== 1)) {
    return true;
  }
  return false;
};
// 上传
const customUpload: UploadProps['httpRequest'] = (options) => {
  const formData = new FormData();
  formData.append('file', options.file);
  const currentItem = uploadDetail.value.find((item) => item.file.uid === options.file.uid)!;
  currentItem.uploadStatus = 1;
  return upload(formData)
    .then((resp) => {
      currentItem.importStatus = 1;
      currentItem.uploadStatus = 2;
      currentItem.uploadFileName = resp.data;
      return importFile(resp.data, importFormat.value)
        .then((importResp) => {
          currentItem.importStatus = 2;
          uploadResult.successNum += 1;
          currentItem.importResp = importResp.data;
        })
        .catch((err) => {
          uploadResult.failNum += 1;
          currentItem.importResp = err.data;
          currentItem.importStatus = -1;
          currentItem.failedReason = err.message;
        })
        .finally(() => {
          if (canNext()) {
            activeStep.value = 2;
          }
        });
    })
    .catch((err) => {
      currentItem.uploadStatus = -1;
      currentItem.importStatus = -1;
      uploadResult.failNum += 1;
      currentItem.failedReason = err.message;
    })
    .finally(() => {
      if (canNext()) {
        activeStep.value = 2;
      }
    });
};

function handleNext() {
  if (!uploadFileInfos.value || uploadFileInfos.value?.length === 0) {
    return;
  }
  uploadDetail.value = uploadFileInfos.value?.map((item) => ({
    file: item,
    uploadStatus: 0,
    importStatus: 0,
    failedReason: '',
  }));
  uploadRef.value!.submit();
  activeStep.value = 1;
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
      uploadFileInfos.value = undefined;
      uploadResult.failNum = 0;
      uploadResult.successNum = 0;
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

.upload-file-list-wrapper {
  display: flex;
  flex-direction: column;
  text-align: left;
  margin: 0 6px;
  width: calc(100% - 12px);
}

.upload-info-box {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  height: 123px;
  max-height: 123px;
  overflow: auto;
  max-width: 522px;
}

.upload-info-list {
  flex: 1;
}

.upload-info-item {
  font-size: 12px;
  line-height: 18px;
  padding: 4px 0;
  color: #424561;
  margin: 0;
  align-items: center;
  position: relative;

  .item-box {
    position: absolute;
    top: 6px;
    right: 4px;
    display: flex;
    align-items: center;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  .item-delete-box {
    position: absolute;
    top: 6px;
    right: 4px;

    svg {
      width: 16px;
      height: 16px;
    }

    .item-delete-active {
      display: none;
    }

    &:hover {
      .item-delete {
        display: none;
      }

      .item-delete-active {
        display: block;
      }
    }
  }

  &:hover {
    background-color: #f7f8fc;
  }
}

.upload-title {
  font-size: 14px;
  font-weight: normal;
  line-height: 21px;
  color: #495ad4;
  padding: 10px 0 0;
  border-bottom: 1px solid #dfe1ed;
  display: inline;

  .sub-info {
    font-size: 12px;
    color: #424561;
  }
}

.import-step-box {
  margin: 0 50px 18px;
}

.select-item-box {
  display: flex;
  margin: 6px 0;

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
    margin-right: 70px;

    :deep(.el-upload-dragger) {
      height: 198px;
      padding-top: 0;

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
  width: 510px;
  height: 193px;
  border-radius: 2px;
  background: #fff;
  border: 1px dashed #dfe1ed;
  margin: 53px auto 0;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #656a85;

  .upload-info-box {
    height: 148px;
    max-height: 148px;
  }
}

.upload-result-box {
  width: calc(100% - 140px);
  padding: 0 70px;

  .upload-result-table {
    border: 1px dashed #dfe1ed;
    margin-top: 8px;
    height: 210px;
    max-height: 210px;
  }
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

.non-tsfile {
  :deep(.el-upload-dragger) {
    height: 167px !important;
  }

  .upload-info-box {
    height: 92px;
    max-height: 92px;
  }
}
</style>
