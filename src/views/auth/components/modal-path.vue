<template>
  <el-dialog
    title="添加路径"
    v-model="dialogVisible"
    width="480px"
    :close-on-click-modal="false"
  >

    <el-radio-group v-model="pathType" @change="handleChangePath" class="path-radio-group">
      <el-radio label="select">
        <span class="radio-label">已有路径：<el-tooltip effect="light" content="仅展示100条搜索结果，如有需要请精确搜索" placement="top"><i-custom-question /></el-tooltip></span>
        <div class="search-path-box">
          <el-select v-model="searchType" class="path-type-select" style="width: 88px;" placeholder="" @change="handleChangeType">
            <el-option v-for="item in pathOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select
            v-model="selectPath"
            placeholder="请输入完整路径"
            filterable
            remote
            clearable
            collapse-tags
            :remote-show-suffix="false"
            :remote-method="remoteMethod"
            style="width: 258px;"
            class="path-select"
          >
            <template #prefix>
              <el-icon class="remote-select-search-icon" size="20"><i-custom-search-icon /></el-icon>
            </template>
            <el-option v-for="item in options" :key="item" :label="item" :value="item">
              <div style="display: flex; width: 200px;">
                <text-tooltip :content="item" />
              </div>
            </el-option>
          </el-select>
        </div>
      </el-radio>
      <el-radio label="input">
        <span class="radio-label">路径模式：</span>
        <el-input v-model="inputPath" placeholder="请输入完整路径" @change="handleInputPath" style="width: 346px;" class="path-input">
          <template #prepend>root.</template>
        </el-input>
      </el-radio>
    </el-radio-group>

    <template #footer>
      <div class="dialog-footer m-t-6">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
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

const pathOptions = ['database', 'device', 'timeseries'];

const pathType = ref('select');
const inputPath = ref('');
const selectPath = ref('');
const searchType = ref('database');
const options = ref<string[]>([]);

const { requestFn: getGroup } = useRequest(StorageApi.getStorageGroups);
const { requestFn: getDevice } = useRequest(StorageApi.getDeviceByGroup);
const { requestFn: getMeasurement } = useRequest(StorageApi.getMeasurementAllList);

let lastQuery = '';
// 获取数据库
const getStorageList = (query: string) => {
  getGroup({}).then((res) => {
    if (lastQuery === query) {
      const data = res.data?.pathNames.filter((item) => item !== 'root.__system') || [];
      options.value = data.filter((item) => item.includes(query));
    }
  });
};

// 查询设备
const getDeviceList = (query: string) => {
  getDevice({
    groupName: 'root',
    keyword: query,
    pageNum: 1,
    pageSize: 100,
  }).then((res) => {
    if (lastQuery === query) {
      options.value = res.data?.pathNames || [];
    }
  });
};

// 查询测点
const getMeasurementList = (query: string) => {
  getMeasurement(query).then((res) => {
    if (lastQuery === query) {
      options.value = res.data?.measurements || [];
    }
  });
};

// 查询数据
const remoteMethod = (query: string) => {
  options.value = [];
  lastQuery = query;
  if (searchType.value === 'database') {
    getStorageList(lastQuery);
  } else if (searchType.value === 'device') {
    getDeviceList(lastQuery);
  } else {
    getMeasurementList(lastQuery);
  }
};

// 变更路径查询方式
function handleChangePath() {
  // inputPath.value = '';
  // selectPath.value = '';
}

// 已有路径搜索方式变更
function handleChangeType() {
  inputPath.value = '';
  selectPath.value = '';
  remoteMethod('');
}

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
      searchType.value = 'database';
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
    margin: 0 0 24px;
  }

  :deep(.el-radio:last-child) {
    margin: 0;
  }
}

.path-type-select{
  :deep(.el-input__wrapper) {
    background-color: #F0F1FA;
  }

  :deep(.el-input__inner) {
    color: #131926;
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
