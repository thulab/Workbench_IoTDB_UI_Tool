<template>
  <el-dialog
    title="添加路径"
    v-model="dialogVisible"
    width="600px"
    align-center
    :close-on-click-modal="false"
    id="auth-path-modal"
  >

    <el-radio-group v-model="pathType" class="path-radio-group m-y-6">
      <el-radio label="select" id="auth-path-modal-select-radio">
        <span class="radio-label">精确路径：<el-tooltip effect="light" content="仅展示100条搜索结果，如有需要请精确搜索" placement="bottom" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></span>
        <div class="search-path-box">
          <el-select
            v-model="selectPath"
            placeholder="请输入精确路径"
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
            <el-option v-for="item in options" :key="item.timeseries" :label="item.timeseries" :value="item.timeseries">
              <div style="display: flex; width: 400px;">
                <text-tooltip :content="item.timeseries" />
              </div>
            </el-option>
          </el-select>
        </div>
      </el-radio>
      <el-radio label="input" id="auth-path-modal-input-radio">
        <span class="radio-label">路径模式：<el-tooltip effect="light" content="支持使用“*、**”进行模糊匹配，“*”代表一层，“**”代表一层或多层" placement="bottom" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip></span>
        <el-input v-model="inputPath" placeholder='请输入序列路径，支持使用"*、**"进行模糊匹配，例如"root.ln.d1.*/root.ln.d1.**"' style="width: 466px;" class="path-input" id="auth-path-modal-input-path" @change="handleInputPath">
          <!-- <template #prepend>root.</template> -->
        </el-input>
      </el-radio>
    </el-radio-group>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" id="auth-path-modal-cancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" id="auth-path-modal-confirm">确定</el-button>
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
      options.value = res.data?.measurements || [];
    }
  });
}, 500);

function handleInputPath(val: string) {
  const res = val.replace(/(\s*$)/g, '');
  const reg = /[.|*]$/;
  if (reg.test(res)) {
    inputPath.value = '';
  } else {
    inputPath.value = res;
  }
}

const handleConfirm = () => {
  let res = selectPath.value;
  if (pathType.value === 'input') {
    handleInputPath(inputPath.value);
    res = inputPath.value;
  }
  if (!res) {
    ElMessage.error('路径不能为空');
    return;
  }
  if (pathType.value === 'input') {
    res = `root.${inputPath.value}`;
  }
  const flag = props.pathList.some((item) => item === res);
  if (flag) {
    ElMessage.error('该路径已存在，请勿重复添加');
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
