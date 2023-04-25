<template>
  <div>
    <div class="search_div">
      <el-select v-model="groupName" :placeholder="$t('device.selectdataconnection')" class="elinput select-icon" @change="getdevicel">
        <el-option
          v-for="item in data.list"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select v-model="deviceName" :placeholder="$t('device.selectp')" class="elinput select-icon m-t-8" @change="getpylist">
        <el-option v-for="item in deviceList" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-input v-model="filterText" :placeholder="$t('device.pleaseinput')" class="elinput input-icon m-t-8" @input="searchpylist">
        <template #suffix><i-ep-search /></template>
      </el-input>
    </div>
    <div class="search_div maxheight">
      <span class="custom-tree-node chil" v-for="(item, index) in pyDataList" :key="'device_' + index" @dblclick="getFunction(item)" :style="{ color: index === 0 ? '#c7c6c6' : 'black' }">
        <el-tooltip :content="item.label" placement="top">
          <span>{{ item.label }}</span>
        </el-tooltip>
        <span>{{ item.decr || '——' }}</span>
        <span>{{ item.type }}</span>
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import type { PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { StorageApi } from '@/api';
import { cloneDeep } from 'lodash-es';

const props = defineProps({
  placeholder: {
    type: String,
    default: '',
  },
  treeList: {
    type: Object as PropType<{ list: Array<{ value: string, label: string }> }>,
    required: true,
    default: () => ({ list: [] }),
  },
  id: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['get-function']);

const { requestFn: getCList } = useRequest(StorageApi.getMeasurementList);
const { requestFn: getDevice } = useRequest(StorageApi.getDeviceByGroup);

const { t } = useI18n();
const data = reactive(props.treeList);
const filterText = ref('');
const groupName = ref('');
const deviceName = ref('');
interface DeviceVo {
  label: string,
  value: string,
  parentid: string
}
let deviceList = reactive < Array<DeviceVo>>([]);

interface PhysicalQuantityVo {
  parents?: string,
  parent?: string,
  label: string | undefined,
  type: IotdbDataType | string | undefined,
  decr: string | undefined
}
const pyCopyDataList = ref<Array<PhysicalQuantityVo>>([]);
const pyDataList = ref<Array<PhysicalQuantityVo>>([]);

function getFunction(val: PhysicalQuantityVo) {
  emit('get-function', val.label);
}
function getdevicel() {
  deviceName.value = '';
  getDevice(props.id, groupName.value).then((res) => {
    const datas = res.data.map((item: string) => ({
      label: item,
      value: item,
      parentid: groupName.value,
    }));
    deviceList.length = 0;
    deviceList = Object.assign(deviceList, datas);
  });
}
function getpylist(deviceData: string) {
  getCList({ pageSize: 99999, pageNum: 1, serverId: props.id }, { deviceName: deviceData }).then((res) => {
    const result: Array<PhysicalQuantityVo> = res.data.measurementVOList.map((item) => ({
      parents: deviceData,
      parent: deviceData,
      label: item.timeseries,
      type: item.dataType,
      decr: item.description,
    }));
    result.unshift({
      label: t('device.measurement'),
      type: t('sqlSearch.type'),
      decr: t('sqlSearch.description'),
    });
    pyDataList.value = result;
    pyCopyDataList.value = cloneDeep(result);
  });
}
function searchpylist() {
  if (!filterText.value) {
    pyDataList.value = pyCopyDataList.value;
  } else {
    pyDataList.value = pyCopyDataList.value.filter((item) => item.label?.indexOf(filterText.value) !== -1);
    pyDataList.value.unshift({
      label: t('device.measurement'),
      type: t('sqlSearch.type'),
      decr: t('sqlSearch.description'),
    });
  }
}

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

.elinput {
  width: 100%;
}
</style>
<style lang="scss">
.select-icon {
  .el-input__suffix {
    top: 0;
  }
}

.input-icon {
  .el-input__suffix {
    top: 7px;
  }
}

.search_div .el-tree-node__content {
  height: 35px !important;
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
