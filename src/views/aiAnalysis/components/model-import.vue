<template>
  <el-dialog :title="t('aiAnalysis.importModel')" v-model="dialogVisible" width="748px" class="new-storage-container" align-center :close-on-click-modal="false" id="ai-analysis-modal-import">
    <div class="import-box">
      <el-steps :active="activeStep" align-center finish-status="success" class="import-step-box" id="ai-analysis-model-import-steps">
        <el-step :title="t('common.chooseFile')">
          <template #title>{{ t('common.chooseFile') }}</template>
        </el-step>
        <el-step :title="t('common.fileImport')" />
        <el-step :title="t('common.importResult')" />
      </el-steps>

      <div class="select-file-box" v-if="activeStep === 0">
        <div class="select-item-box">
          <div class="select-item-label model-id-require" style="display: flex; align-items: center">{{ t('aiAnalysis.modelName') }}：</div>
          <div style="position: absolute; margin-left: 68px; margin-top: -4px">
            <el-tooltip effect="light" placement="top" popper-class="tooltip-box-width">
              <template v-slot:content>
                <div v-html="t('aiAnalysis.importModelNameHover')"></div>
              </template>
              <i-custom-question />
            </el-tooltip>
          </div>
          <el-input v-model="modelId" :placeholder="t('aiAnalysis.modelNamePlaceholder')" id="ai-analysis-search-name" style="width: 536px" maxlength="100" show-word-limit />
        </div>

        <div class="select-item-box" style="margin-left: 8px">
          <span class="select-item-label">{{ t('common.importFile') }}：</span>
          <div style="width: 536px">
            <el-upload
              ref="uploadRef"
              class="import-upload"
              drag
              multiple
              :limit="2"
              accept=".pt, .yaml"
              :auto-upload="false"
              :before-upload="beforeUpload"
              :show-file-list="false"
              :on-exceed="handleExceed"
              :on-change="handleChange"
              :on-remove="handleRemove"
              :http-request="customUpload"
              id="model-import-upload"
            >
              <el-icon size="80" v-if="!uploadFileInfo"><i-custom-upload /></el-icon>
              <el-icon size="80" v-else><i-custom-file-info /></el-icon>
              <div class="file-info-box" v-if="uploadFilePt">
                {{ uploadFilePt.name }}
                <el-icon size="20" style="margin-left: 5px" @click.stop="deleteModelFile"><i-custom-delete /></el-icon>
              </div>
              <div class="file-info-box" v-if="uploadFileYaml">
                {{ uploadFileYaml.name }}
                <el-icon size="20" style="margin-left: 5px" @click.stop="deleteConfigFile"><i-custom-delete /></el-icon>
              </div>
              <div class="el-upload__text">
                {{ t('aiAnalysis.importModelFile') }}
                <em>{{ !uploadFilePt && !uploadFileYaml ? t('common.clickUpload') : t('common.clickReupload') }}</em>
              </div>

              <template #tip>
                <div class="el-upload__tip"></div>
              </template>
            </el-upload>
            <div class="import-model-tip">
              {{ t('aiAnalysis.importModelTip') }}
            </div>
          </div>
        </div>
      </div>

      <div class="select-result-box" v-if="activeStep === 1">
        <el-icon size="80"><i-custom-waiting /></el-icon>
        {{ t('common.uploading') }}…
        <div class="file-info-box" v-if="uploadFilePt">
          {{ uploadFilePt.name }}
          <el-icon size="20" style="margin-left: 5px; margin-right: 5px"><i-custom-half-arrow-right /></el-icon>
          model.pt
          <el-icon v-if="uploadStatusPt === 'success'" size="20" style="margin-left: 5px; margin-right: 5px"><i-custom-upload-success /></el-icon>
          <el-icon v-else size="20" class="rotate" style="margin-left: 5px; margin-right: 5px"><i-custom-uploading /></el-icon>
        </div>
        <div class="file-info-box" v-if="uploadFileYaml">
          {{ uploadFileYaml.name }}
          <el-icon size="20" style="margin-left: 5px; margin-right: 5px"><i-custom-half-arrow-right /></el-icon>
          config.yaml
          <el-icon v-if="uploadStatusYaml === 'success'" size="20" style="margin-left: 5px; margin-right: 5px"><i-custom-upload-success /></el-icon>
          <el-icon v-else size="20" class="rotate" style="margin-left: 5px; margin-right: 5px"><i-custom-uploading /></el-icon>
        </div>
      </div>

      <div class="select-result-box" v-if="activeStep === 2">
        <div class="success-box" v-if="uploadStatusPt === 'success' && uploadStatusYaml === 'success'">
          <el-icon size="44"><i-custom-success-green /></el-icon>
          <span class="success-tip">{{ t('aiAnalysis.importSuccessTip') }}</span>
        </div>

        <div class="success-box" v-else>
          <el-icon size="44"><i-custom-error /></el-icon>
          <span class="error-tip">{{ t('aiAnalysis.importErrorTip') }}</span>
        </div>
      </div>
    </div>

    <div class="m-t-12 operate-buttons" style="text-align: right" v-if="activeStep === 0">
      <el-button type="primary" :disabled="!uploadFilePt || !uploadFileYaml || !modelId" @click="handleNext" id="model-import-next">{{ t('common.next') }}</el-button>
    </div>

    <div class="m-t-12 operate-buttons" style="height: 28px" v-if="activeStep === 1"></div>

    <div class="m-t-12 operate-buttons" style="text-align: center" v-if="activeStep === 2">
      <el-button type="primary" @click="handleClose" id="model-import-close">{{ t('common.finish') }}</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { genFileId } from 'element-plus';
import type { UploadInstance, UploadProps, UploadRawFile } from 'element-plus';
import { AIAnalysisApi } from '@/api';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (e: 'handle-close', reload: boolean): void;
}>();

const { requestFn: importModel } = useRequest(AIAnalysisApi.importModel);
const { requestFn: checkModelName } = useRequest(AIAnalysisApi.checkModelName);

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const uploadRef = ref<UploadInstance>();
const activeStep = ref(0);
const uploadFileInfo = ref<File>();
const uploadFilePt = ref<File>();
const uploadFileYaml = ref<File>();
const uploadStatusPt = ref('');
const uploadStatusYaml = ref('');
const modelId = ref('');

const checkValid = (name: string) => {
  const suffix = name.split('.');
  const ptReg = /pt|yaml/i;
  const isModel = ptReg.test(suffix[suffix.length - 1]) && suffix.length > 1;
  return isModel;
};

const beforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isModel = checkValid(rawFile.name);
  if (!isModel) {
    ElMessage.error({ message: t('aiAnalysis.importModelRule'), grouping: true });
    return false;
  }

  if (rawFile.name.endsWith('.pt')) {
    uploadFilePt.value = rawFile;
  } else {
    uploadFileYaml.value = rawFile;
  }

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
  if (uploadFile.name.endsWith('.pt')) {
    uploadFilePt.value = uploadFile.raw;
  } else {
    uploadFileYaml.value = uploadFile.raw;
  }
};
// 删除文件
const handleRemove: UploadProps['onRemove'] = () => {
  uploadFilePt.value = undefined;
  uploadFileYaml.value = undefined;
};
// 上传
const customUpload: UploadProps['httpRequest'] = () => {};

function handleSubmit() {
  importModel(uploadFilePt.value, uploadFileYaml.value, modelId.value)
    .then((res) => {
      if (res.code === 0) {
        uploadStatusPt.value = 'success';
        uploadStatusYaml.value = 'success';
      }
    })
    .finally(() => {
      activeStep.value = 2;
    });
}

function handleNext() {
  uploadRef.value!.submit();
  if (uploadFilePt.value && uploadFileYaml.value && modelId.value) {
    const isModel = checkValid(uploadFilePt.value.name) && checkValid(uploadFileYaml.value.name);
    if (!isModel) return;

    if (modelId.value.length < 2 || modelId.value.length > 64) {
      ElMessage.error({ message: t('aiAnalysis.modelNameRuleError'), grouping: true });
      return;
    }

    const checkModelId = /^[0-9a-zA-Z_]+$/.test(modelId.value);
    if (!checkModelId) {
      ElMessage.error({ message: t('aiAnalysis.modelNameRuleError'), grouping: true });
      return;
    }

    checkModelName(modelId.value).then((res) => {
      if (res.code === 0 && res.data) {
        ElMessage.error({ message: t('aiAnalysis.modelNameExist'), grouping: true });
      } else {
        nextTick(() => {
          activeStep.value = 1;
          handleSubmit();
        });
      }
    });
  }
}

function handleClose() {
  dialogVisible.value = false;
  emit('handle-close', uploadStatusPt.value === 'success' && uploadStatusYaml.value === 'success');
}

function deleteModelFile() {
  uploadFilePt.value = undefined;
}

function deleteConfigFile() {
  uploadFileYaml.value = undefined;
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      activeStep.value = 0;
      uploadFilePt.value = undefined;
      uploadFileYaml.value = undefined;
      modelId.value = '';
      uploadStatusPt.value = '';
      uploadStatusYaml.value = '';
    }
  }
);
</script>

<style scoped lang="scss">
.new-storage-container {
  position: relative;

  .import-box {
    background-color: #f7f8fc;
    padding: 24px 16px;
    height: 340px;
    box-sizing: border-box;

    .file-info-box {
      font-size: 12px;
      font-weight: 400;
      line-height: 18px;
      color: #495ad4;
      margin-bottom: 2px;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
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

.model-id-require::before {
  content: '*';
  color: #d43030;
  margin-right: 4px;
}

.import-model-tip {
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  color: #656a85;
}

.rotate {
  animation: rotate 5s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0);
  }

  25% {
    transform: rotate(90deg);
  }

  50% {
    transform: rotate(180deg);
  }

  75% {
    transform: rotate(270deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
