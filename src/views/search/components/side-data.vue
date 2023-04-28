<template>
  <div class="search_div maxheight">
    <div class="more-select-box">
      <!-- <el-input placeholder="请选择存储组" v-model="storageName" readonly @focus="handleVisible('storage', true)" />
      <div v-show="isShowStorage" class="select-box-down">
        <el-input placeholder="输入关键字进行过滤" v-model="filterStorageText" size="small" @input="handleInput('storage')"></el-input>

        <ul class="select-list-box">
          <li v-for="item in storageList" :key="item" class="list-item-box" @click="handleSelect(item, 'storage')">
            <text-tooltip :content="item" class-name="list-item-text" />
          </li>
          <li v-if="Math.ceil(storageTotal / 100) > storagePagination.pageNum && !storageLoading" @click="handleMore('storage')">加载更多</li>
        </ul>
      </div> -->
      <el-select v-model="storageName" placeholder="请选择存储组" @change="val => handleSelect(val, 'storage')">
        <el-option v-for="item in storageList" :key="item" :value="item" :label="item" />
      </el-select>
    </div>

    <div class="more-select-box">
      <el-input placeholder="请选择设备" v-model="deviceName" readonly :disabled="!storageName" @focus="handleVisible('device', true)" />
      <div v-show="isShowDevice" class="select-box-down">
        <el-input placeholder="输入关键字进行过滤" v-model="filterDeviceText" size="small" @input="handleInput('device')" />

        <ul class="select-list-box">
          <li v-for="item in deviceList" :key="item" class="list-item-box" @click="handleSelect(item, 'device')">
            <text-tooltip :content="item" class-name="list-item-text" />
          </li>
          <li v-if="Math.ceil(deviceTotal / 100) > devicePagination.pageNum && !deviceLoading" @click="handleMore('device')">加载更多</li>
        </ul>
      </div>
    </div>

    <div class="more-select-box">
      <el-input placeholder="请选择物理量名称" v-model="measurementName" readonly :disabled="!deviceName" @focus="handleVisible('measurement', true)" />
      <div v-show="isShowMeasurement" class="select-box-down">
        <el-input placeholder="输入关键字进行过滤" v-model="filterMeasurementText" size="small" @input="handleInput('measurement')" />

        <ul class="select-list-box">
          <li v-for="item in measurementList" :key="item" class="list-item-box" @click="handleSelect(item, 'measurement')">
            <text-tooltip :content="item" class-name="list-item-text" />
          </li>
          <li v-if="Math.ceil(measurementTotal / 100) > measurementPagination.pageNum && !measurementLoading" @click="handleMore('measurement')">加载更多</li>
        </ul>
      </div>
    </div>

    <div class="search-buttons">
      <el-button type="primary" @click="handleAdd">添加</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>
  </div>

</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ClickOutside as vClickOutside } from 'element-plus/lib/directives';
import { StorageApi } from '@/api';

const props = defineProps<{
  serverId: string;
}>();

const emit = defineEmits(['get-function']);

const { requestFn: getGroup } = useRequest(StorageApi.getStorageGroups);
const { requestFn: getDevice } = useRequest(StorageApi.getDeviceByGroup);
const { requestFn: getMeasurement } = useRequest(StorageApi.getMeasurementList);

const storageName = ref('');
const isShowStorage = ref(false);
const filterStorageText = ref('');
const storageList = ref<string[]>([]);
const storageTotal = ref(0);
const storagePagination = reactive({
  pageSize: 100,
  pageNum: 1,
});
const storageLoading = ref(false);

const deviceName = ref('');
const isShowDevice = ref(false);
const filterDeviceText = ref('');
const deviceList = ref<string[]>([]);
const deviceTotal = ref(0);
const devicePagination = reactive({
  pageSize: 100,
  pageNum: 1,
});
const deviceLoading = ref(false);

const measurementName = ref('');
const isShowMeasurement = ref(false);
const filterMeasurementText = ref('');
const measurementList = ref<string[]>([]);
const measurementTotal = ref(0);
const measurementPagination = reactive({
  pageSize: 100,
  pageNum: 1,
});
const measurementLoading = ref(false);

// 关闭/显示下拉项
function handleVisible(type: string, visible: boolean) {
  if (type === 'storage') {
    isShowStorage.value = visible;
  } else if (type === 'device') {
    isShowDevice.value = visible;
  } else {
    isShowMeasurement.value = visible;
  }
}
// 获取存储组
function getStorageList() {
  storageLoading.value = true;
  getGroup({
    serverId: props.serverId,
    pageSize: storagePagination.pageSize,
    pageNum: storagePagination.pageNum,
    keyword: filterStorageText.value,
  }).then((res) => {
    const dataArr = res.data?.storageGroupNames.map((item) => item);
    storageList.value = storageList.value.concat(dataArr);
    storageTotal.value = res.data?.totalCount || 0;
  }).finally(() => {
    storageLoading.value = false;
  });
}
// 获取设备
function getDeviceList() {
  deviceLoading.value = true;
  getDevice({
    serverId: props.serverId,
    groupName: storageName.value,
    pageSize: devicePagination.pageSize,
    pageNum: devicePagination.pageNum,
    keyword: filterDeviceText.value,
  }).then((res) => {
    const dataArr = res.data?.pathNames.map((item) => item);
    deviceList.value = deviceList.value.concat(dataArr);
    deviceTotal.value = res.data?.totalCount || 0;
  }).finally(() => {
    deviceLoading.value = false;
  });
}
// 获取物理量
function getMeasurementList() {
  measurementLoading.value = true;
  getMeasurement({
    serverId: props.serverId,
    deviceName: deviceName.value,
    pageSize: measurementPagination.pageSize,
    pageNum: measurementPagination.pageNum,
    keyword: filterMeasurementText.value,
  }).then((res) => {
    const dataArr = res.data?.pathNames.map((item) => item);
    measurementList.value = measurementList.value.concat(dataArr);
    measurementTotal.value = res.data?.totalCount || 0;
  }).finally(() => {
    measurementLoading.value = false;
  });
}
// 加载更多
function handleMore(type: string) {
  if (type === 'storage') {
    storagePagination.pageNum += 1;
    getStorageList();
  } else if (type === 'device') {
    devicePagination.pageNum += 1;
    getDeviceList();
  } else {
    measurementPagination.pageNum += 1;
    getMeasurementList();
  }
}
// 选择
function handleSelect(val: string, type: string) {
  if (type === 'storage') {
    isShowStorage.value = false;
    if (val === storageName.value) return;
    storageName.value = val;
    deviceList.value = [];
    devicePagination.pageNum = 1;
    getDeviceList();
  } else if (type === 'device') {
    isShowDevice.value = false;
    if (val === deviceName.value) return;
    deviceName.value = val;
    measurementList.value = [];
    measurementPagination.pageNum = 1;
    getMeasurementList();
  } else {
    isShowMeasurement.value = false;
  }
}
// 输入搜索条件
function handleInput(type: string) {
  if (type === 'storage') {
    storagePagination.pageNum = 1;
    storageList.value = [];
    getStorageList();
  } else if (type === 'device') {
    devicePagination.pageNum = 1;
    deviceList.value = [];
    getDeviceList();
  } else {
    measurementPagination.pageNum = 1;
    measurementList.value = [];
    getMeasurementList();
  }
}
// 添加
function handleAdd() {
  const res = measurementName.value || deviceName.value || storageName.value;
  emit('get-function', res);
}
// 重置
function handleReset() {
  storageName.value = '';
  deviceName.value = '';
  measurementName.value = '';
  storagePagination.pageNum = 1;
  getStorageList();
}

onMounted(() => {
  getStorageList();
});

</script>

<style lang="scss" scoped>
.search_div {
  padding: 10px 20px;
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

</style>
