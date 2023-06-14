<template>
  <el-dialog
    title="添加路径"
    v-model="dialogVisible"
    width="480px"
    :close-on-click-modal="false"
  >

    <el-radio-group v-model="pathType" @change="handleChangePath">
      <el-radio label="input">
        <span class="radio-label">路径模式：</span>
        <el-input v-model="inputPath" placeholder="请输入完整路径" :disabled="pathType !== 'input'" />
      </el-radio>
      <el-radio label="select">
        <span class="radio-label">已有路径：<el-tooltip effect="light" content="仅展示100条搜索结果，如有需要请精确搜索" placement="top"><i-custom-question /></el-tooltip></span>
        <div class="search-path-box">
          <el-select v-model="searchType" style="width: 90px;" placeholder="" @change="handleChangeType" :disabled="pathType !== 'select'">
            <el-option v-for="item in pathOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select
            v-model="selectPath"
            placeholder="请输入完整路径"
            filterable
            remote
            clearable
            collapse-tags
            collapse-tags-tooltip
            :remote-show-suffix="false"
            :remote-method="remoteMethod"
            style="width: 256px;"
            :disabled="pathType !== 'select'"
          >
            <template #prefix>
              <el-icon class="remote-select-search-icon" size="20"><i-custom-search-icon /></el-icon>
            </template>
            <el-option v-for="item in options" :key="item" :label="item" :value="item">
              <div class="remote-select-search-text">
                <text-tooltip :content="item" />
              </div>
            </el-option>
          </el-select>
        </div>
      </el-radio>
    </el-radio-group>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
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
  inputPath.value = '';
  selectPath.value = '';
}

// 已有路径搜索方式变更
function handleChangeType() {
  inputPath.value = '';
  selectPath.value = '';
  remoteMethod('');
}

const handleConfirm = () => {
  let res = inputPath.value;
  if (pathType.value === 'select') {
    res = selectPath.value;
  }
  const flag = props.pathList.some((item) => item === res);
  if (flag) {
    ElMessage.error('该路径已存在，请勿重复添加');
    return;
  }
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
    right: 10px;
  }
}

.search-path-box{
  display: inline-flex;
}
</style>
