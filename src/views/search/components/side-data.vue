<template>
  <div class="search_div maxheight">
    <!-- <el-input placeholder="请选择数据库" v-model="storageName" readonly @focus="handleVisible('storage', true)" />
      <div v-show="isShowStorage" class="select-box-down">
        <el-input placeholder="输入关键字进行过滤" v-model="filterStorageText" size="small" @input="handleInput('storage')"></el-input>

        <ul class="select-list-box">
          <li v-for="item in storageList" :key="item" class="list-item-box" @click="handleSelect(item, 'storage')">
            <text-tooltip :content="item" class-name="list-item-text" />
          </li>
          <li v-if="Math.ceil(storageTotal / 100) > storagePagination.pageNum && !storageLoading" @click="handleMore('storage')">加载更多</li>
        </ul>
      </div> -->
    <el-select v-model="storageName" style="width: 100%;" placeholder="请选择数据库" @change="handleSelectDatabase" :loading="storageLoading">
      <el-option v-for="item in storageList" :key="item" :value="item" :label="item" />
    </el-select>

    <el-select
      class="m-t-10"
      style="width: 100%;"
      :disabled="!storageName"
      v-model="deviceName"
      placeholder="请选择设备"
      filterable
      remote
      remote-show-suffix
      :remote-method="handleDeviceInput"
      :loading="deviceLoading"
      v-loading="deviceLoading && !deviceName"
      @change="handleSelectDevice">
      <el-option v-for="item in deviceList" :key="item" :label="item" :value="item" />
    </el-select>
    <!-- <el-input placeholder="请选择设备" v-model="deviceName" readonly :disabled="!storageName" @focus="handleVisible('device', true)" />
      <div v-show="isShowDevice" class="select-box-down">
        <el-input placeholder="输入关键字进行过滤" v-model="filterDeviceText" size="small" @input="handleInput('device')" />

        <ul class="select-list-box">
          <li v-for="item in deviceList" :key="item" class="list-item-box" @click="handleSelect(item, 'device')">
            <text-tooltip :content="item" class-name="list-item-text" />
          </li>
        </ul>
      </div> -->

    <el-input class="m-y-10" :disabled="!deviceName" v-model="filterMeasurementText" placeholder="输入关键字进行过滤" @input="handleInput('measurement')">
      <template #suffix><i-ep-search /></template>
    </el-input>
    <!-- <el-input placeholder="请选择物理量名称" v-model="measurementName" readonly :disabled="!deviceName" @focus="handleVisible('measurement', true)" />
      <div v-show="isShowMeasurement" class="select-box-down">
        <el-input placeholder="输入关键字进行过滤" v-model="filterMeasurementText" size="small" @input="handleInput('measurement')" />

        <ul class="select-list-box">
          <li v-for="item in measurementList" :key="item" class="list-item-box" @click="handleSelect(item, 'measurement')">
            <text-tooltip :content="item" class-name="list-item-text" />
          </li>
        </ul>
      </div> -->

    <div class="search-buttons">
      <el-button v-if="false" type="primary" @click="handleAdd(storageName)">当前数据库</el-button>
      <el-button v-if="false" type="primary" @click="handleAdd(deviceName)">当前设备</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>
    <el-table :data="measurementList" :max-height="maxTableHeight" v-loading="measurementLoading" tooltip-effect="light" :tooltip-options="{ placement: 'left' }" @row-dblclick="(row, column, event)=>handleAdd(row)">
      <el-table-column align="center" label="测点" v-slot="{ row }" show-overflow-tooltip>
        {{ row }}
      </el-table-column>
    </el-table>
    <!-- <ul class="select-list-box">
      <li v-for="item in measurementList" :key="item" class="list-item-box" @dblclick="handleAdd(item)">
        <text-tooltip placement="left" :content="item" class-name="list-item-text" />
      </li>
    </ul> -->
    <!-- <div class="search_div maxheight">
      <span class="custom-tree-node chil" v-for="(item, index) in measurementList" :key="'device_' + index" @dblclick="handleAdd(item)" :style="{ color: index === 0 ? '#c7c6c6' : 'black' }">
        {{ item }}
      </span>
    </div> -->
  </div>

</template>

<script lang="ts" setup>
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';

const props = defineProps<{
  serverId: number;
}>();

const { maxTableHeight } = useTableHeight(500);

const emit = defineEmits(['get-function']);

const { requestFn: getGroup, loading: storageLoading } = useRequest(StorageApi.getStorageGroups);
const { requestFn: getDevice, loading: deviceLoading } = useRequest(StorageApi.getDeviceByGroup);
const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementList);

const storageName = ref('');
const storageList = ref<string[]>([]);
const storageTotal = ref(0);
// const storagePagination = reactive({
//   pageSize: 100,
//   pageNum: 1,
// });

const deviceName = ref('');
const deviceList = ref<string[]>([]);
const deviceTotal = ref(0);
// const devicePagination = reactive({
//   pageSize: 100,
//   pageNum: 1,
// });

const measurementName = ref('');
const filterMeasurementText = ref('');
const measurementList = ref<string[]>([]);
const measurementTotal = ref(0);
// const measurementPagination = reactive({
//   pageSize: 100,
//   pageNum: 1,
// });

// 获取数据库
function getStorageList() {
  getGroup({
    serverId: props.serverId,
    // pageSize: storagePagination.pageSize,
    // pageNum: storagePagination.pageNum,
    // keyword: filterStorageText.value,
  }).then((res) => {
    const dataArr = res.data?.pathNames.map((item) => item);
    storageList.value = dataArr;
    storageTotal.value = res.data?.totalCount || 0;
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
    serverId: props.serverId,
    groupName: storageName.value,
    // pageSize: devicePagination.pageSize,
    // pageNum: devicePagination.pageNum,
    keyword: query,
  }).then((res) => {
    if (query === lastDeviceQuery && lastSelectedDatabase === storageName.value) {
      const dataArr = res.data?.pathNames;
      deviceList.value = deviceList.value.concat(dataArr);
      deviceTotal.value = res.data?.totalCount || 0;
    }
  });
}
// 获取物理量
function getMeasurementList() {
  lastMeasurementQuery = filterMeasurementText.value;
  getMeasurement({
    serverId: props.serverId,
    deviceName: deviceName.value,
    keyword: lastMeasurementQuery,
  }).then((res) => {
    if (lastMeasurementQuery === filterMeasurementText.value && lastSelectedDevice === deviceName.value) {
      measurementList.value = res.data?.pathNames;
      measurementTotal.value = res.data?.totalCount || 0;
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
    overflow: auto;
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

</style>
