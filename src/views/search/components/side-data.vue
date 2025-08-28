<template>
  <div class="search_div max-height">
    <el-select
      v-model="storageName"
      style="width: 100%"
      :placeholder="t('search.databaseSelectPlaceholder')"
      @change="handleSelectDatabase"
      :loading="storageLoading"
      :placement="'bottom-start'"
      fit-input-width
      id="sql-search-data-select-databse"
    >
      <el-option v-for="item in storageList" :key="item" :value="item" :label="item" :id="`sql-search-data-select-databse-${item}`">
        <div style="display: flex; width: 160px">
          <text-tooltip :content="item" />
        </div>
      </el-option>
    </el-select>

    <el-select
      class="m-t-10"
      style="width: 100%"
      :disabled="!storageName"
      v-model="deviceName"
      :placeholder="t('search.deviceSelectPlaceholder')"
      filterable
      remote
      remote-show-suffix
      :remote-method="handleDeviceInput"
      :loading="deviceLoading"
      v-loading="deviceLoading && !deviceName"
      :placement="'bottom-start'"
      fit-input-width
      @change="handleSelectDevice"
      id="sql-search-data-select-device"
    >
      <el-option v-for="item in deviceList" :key="item" :label="item" :value="item" :id="`sql-search-data-select-device-${item}`">
        <div style="display: flex; width: 160px">
          <text-tooltip :content="item" />
        </div>
      </el-option>
    </el-select>

    <el-input
      class="m-y-10"
      :disabled="!deviceName"
      v-model="filterMeasurementText"
      :placeholder="t('measurement.measurementNamePlaceholder')"
      @input="handleInput('measurement')"
      id="sql-search-data-input-measurement"
    >
      <template #suffix><i-ep-search /></template>
    </el-input>

    <div class="search-buttons">
      <!-- <el-button v-if="false" type="primary" @click="handleAdd(storageName)" id="sql-search-data-add-databse">当前数据库</el-button>
      <el-button v-if="false" type="primary" @click="handleAdd(deviceName)" id="sql-search-data-add-device">当前设备</el-button> -->
      <el-button @click="handleReset" id="sql-search-data-reset">{{ t('common.reset') }}</el-button>
    </div>
    <el-table
      v-if="measurementList && measurementList.length > 0"
      :data="measurementList"
      :max-height="maxTableHeight"
      v-loading="measurementLoading"
      tooltip-effect="light"
      :tooltip-options="{ placement: 'left', popperClass: 'table-tooltip-max-width' }"
      @row-dblclick="(row, column, event) => handleAdd(row)"
    >
      <el-table-column align="center" :label="t('measurement.measurement')" v-slot="{ row }" show-overflow-tooltip>
        {{ row }}
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';

const { maxTableHeight } = useTableHeight(500);

const emit = defineEmits(['get-function']);
const { t } = useI18n();
const { requestFn: getDatabaseList, loading: storageLoading } = useRequest(StorageApi.getDatabases);
const { requestFn: getDevice, loading: deviceLoading } = useRequest(StorageApi.getDeviceByGroup);
const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementList);

const storageName = ref('');
const storageList = ref<string[]>([]);
const deviceName = ref('');
const deviceList = ref<string[]>([]);
const measurementName = ref('');
const filterMeasurementText = ref('');
const measurementList = ref<string[]>([]);

// 获取数据库
function getStorageList() {
  getDatabaseList({}).then((res) => {
    const dataArr = res.data?.pathNames.map((item) => item);
    storageList.value = dataArr;
  });
}
let lastSelectedDatabase = '';
let lastSelectedDevice = '';
let lastDeviceQuery = '';
let lastMeasurementQuery = '';
// 获取设备
function getDeviceList(query: string) {
  lastDeviceQuery = query;
  getDevice({
    groupName: storageName.value,
    keyword: query,
  }).then((res) => {
    if (query === lastDeviceQuery && lastSelectedDatabase === storageName.value) {
      const dataArr = res.data?.pathNames;
      deviceList.value = deviceList.value.concat(dataArr);
    }
  });
}
// 获取物理量
function getMeasurementList() {
  lastMeasurementQuery = filterMeasurementText.value;
  getMeasurement({
    deviceName: deviceName.value,
    keyword: lastMeasurementQuery,
  }).then((res) => {
    if (lastMeasurementQuery === filterMeasurementText.value && lastSelectedDevice === deviceName.value) {
      measurementList.value = res.data?.pathNames;
    }
  });
}

function handleSelectDatabase(val: string) {
  lastSelectedDatabase = val;
  deviceName.value = '';
  measurementName.value = '';
  deviceList.value = [];
  measurementList.value = [];
  getDeviceList('');
}
function handleSelectDevice(val: string) {
  lastSelectedDevice = val;
  measurementName.value = '';
  measurementList.value = [];
  getMeasurementList();
}

const handleDeviceInput = debounce((query: string) => {
  deviceList.value = [];
  getDeviceList(query);
}, 500);
// 输入搜索条件
const handleInput = debounce((type: string) => {
  if (type === 'storage') {
    storageList.value = [];
    getStorageList();
  } else {
    measurementList.value = [];
    getMeasurementList();
  }
}, 500);
// 添加
function handleAdd(item: string) {
  const res = item || deviceName.value || storageName.value;
  emit('get-function', res);
}
// 重置
function handleReset() {
  storageName.value = '';
  deviceName.value = '';
  filterMeasurementText.value = '';
  measurementName.value = '';
  measurementList.value = [];
  getStorageList();
}

onMounted(() => {
  getStorageList();
});
</script>

<style lang="scss" scoped>
.search_div {
  padding: 20px 0;
  background: #fff;

  &.maxheight {
    height: 65vh;
    overflow: hidden auto;
  }
}

.more-select-box {
  margin-bottom: 12px;
  position: relative;
}

.select-box-down {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1;
  border: 1px solid #eee;
  background: #fff;
  border-radius: 4px;
}

.select-list-box {
  max-height: 400px;
  overflow-y: auto;
}

.list-item-box {
  padding: 0 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  cursor: pointer;

  &:hover {
    background-color: #f7fafc;
  }
}

.custom-tree-node.chil {
  display: flex;
  font-size: 12px;
  justify-content: space-between;
  border-bottom: 1px solid #ebeef5;
  padding: 10px 0;
  cursor: pointer;

  span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.search-buttons {
  text-align: right;
  margin-bottom: 16px;
}
</style>
