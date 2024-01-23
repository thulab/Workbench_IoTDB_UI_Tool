<template>
  <el-dialog
    :title="t('auth.addPath')"
    v-model="dialogVisible"
    width="600px"
    align-center
    :close-on-click-modal="false"
    id="auth-path-modal"
  >

    <el-radio-group v-model="pathType" class="path-radio-group m-y-6">
      <el-radio label="select" id="auth-path-modal-select-radio">
        <span class="radio-label">{{t('auth.exactPath')}}：<el-tooltip effect="light" :content="t('common.searchTipLimit100')" placement="bottom" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></span>
        <div class="search-path-box">
          <el-select
            v-model="selectPath"
            :placeholder="t('auth.exactPathPlaceholder')"
            filterable
            remote
            clearable
            collapse-tags
            :remote-show-suffix="false"
            :remote-method="remoteMethod"
            :loading="measurementLoading"
            style="width: 466px;"
            class="path-select"
            id="auth-path-modal-select-path"
          >
            <template #prefix>
              <el-icon class="remote-select-search-icon" size="20"><i-custom-search-icon /></el-icon>
            </template>
            <el-option v-for="item in options" :key="item.timeseries" :label="item.timeseries" :value="item.timeseries" :id="`auth-path-modal-select-path-select-${item.timeseries}`">
              <div style="display: flex; width: 400px;">
                <text-tooltip :content="item.timeseries" />
              </div>
            </el-option>
          </el-select>
        </div>
      </el-radio>
      <el-radio label="input" id="auth-path-modal-input-radio">
        <span class="radio-label">{{t('auth.pathMode')}}：<el-tooltip effect="light" :content="t('auth.pathModeTip')" placement="bottom" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></span>
        <el-input v-model="inputPath" :placeholder="t('auth.pathModePlaceholder')" style="width: 466px;" class="path-input" id="auth-path-modal-input-path">
          <!-- <template #prepend>root.</template> -->
        </el-input>
      </el-radio>
    </el-radio-group>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" id="auth-path-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm" id="auth-path-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  pathList: string[];
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', payload: string): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const { t } = useI18n();
const pathType = ref('select');
const inputPath = ref('');
const selectPath = ref('');
const options = ref<StorageDevice.MeasurementDataItem[]>([]);

const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementAllObjList);

let lastQuery = '';
// 查询数据
const remoteMethod = debounce((query: string) => {
  lastQuery = query;
  getMeasurement(lastQuery).then((res) => {
    if (lastQuery === query) {
      options.value = res.data?.measurements?.filter((item) => !item.timeseries.startsWith('root.__system')) || [];
    }
  });
}, 500);

const handleConfirm = () => {
  let res = selectPath.value;
  if (pathType.value === 'input') {
    const validInputRes = inputPath.value.replace(/(\s*$)/g, '');
    if (validInputRes.endsWith('.') || (validInputRes.endsWith('*') && !validInputRes.endsWith('**'))) {
      ElMessage.warning(t('auth.pathEndTip'));
      return;
    }
    inputPath.value = validInputRes;
    res = inputPath.value;
  }
  if (!res) {
    ElMessage.error(t('auth.pathEmptyRule'));
    return;
  }
  // if (pathType.value === 'input') {
  //   res = `root.${inputPath.value}`;
  // }
  const flag = props.pathList.some((item) => item === res);
  if (flag) {
    ElMessage.error(t('auth.pathExistTip'));
    return;
  }
  dialogVisible.value = false;
  emit('handleSave', res);
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      pathType.value = 'select';
      inputPath.value = '';
      selectPath.value = '';
      options.value = [];
      remoteMethod('');
    }
  },
);

</script>

<style lang="scss" scoped>
.radio-label{
  position: relative;
  width: 80px;
  display: inline-flex;
  text-align: left;

  svg{
    position: absolute;
    top: -6px;
    right: 12px;
  }
}

.search-path-box{
  display: inline-flex;
}

.path-radio-group{
  :deep(.el-radio) {
    margin: 0 0 20px;
  }

  :deep(.el-radio:last-child) {
    margin: 0;
  }

  :deep(.el-radio__label) {
    display: inline-flex;
    align-items: center;
  }
}

.path-type-select{
  :deep(.el-input__wrapper) {
    background-color: #F0F1FA;
  }

  :deep(.el-input__inner) {
    color: #131926;
  }

  :deep(.el-select-v2__wrapper) {
    background-color: #F0F1FA;
  }

  :deep(.el-select-v2__placeholder) {
    color: #131926 !important;
  }
}

.path-select{
  :deep(.el-input__suffix) {
    background-color: transparent;
  }
}

.path-input{
  :deep(.el-input-group__prepend) {
    width: 40px;
    padding: 0;
  }
}
</style>
