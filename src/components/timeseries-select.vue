<template>
  <div>
    <el-select
      class="remote-select-box"
      v-model="model"
      :placeholder="'请选择测点'"
      filterable
      remote
      clearable
      multiple
      collapse-tags
      :collapse-tags-tooltip="false"
      :remote-method="remoteMethod"
      :loading="measurementLoading"
      style="width: 256px;"
    >
      <template #prefix>
        <el-icon class="remote-select-search-icon" size="20"><i-custom-search-icon /></el-icon>
      </template>
      <el-option v-for="item in measurementList" :key="item.timeseries" :label="item.timeseries" :value="item.timeseries" :disabled="isBooleanTextDisabled ? (item.dataType === 'BOOLEAN' || item.dataType === 'TEXT') : false">
        <div class="remote-select-search-text">
          <text-tooltip :content="item.timeseries" />
        </div>
      </el-option>
    </el-select>
    <el-button v-if="isShowViewBtn" type="primary" :disabled="!model.length" class="m-l-12" @click="()=>dialogVisible = true">{{viewText || '已选测点' }}</el-button>
    <el-dialog :title="viewText || '已选测点'" v-model="dialogVisible" class="select-modal" align-center>
      <el-scrollbar :max-height="400">
        <ul class="select-list">
          <li v-for="(item, index) in model" :key="item" class="select-item">
            <span class="select-item-text"><text-tooltip :content="item" /></span>
            <div class="select-item-delete-box" @click="handleDelete(index)">
              <i-custom-delete class="select-item-delete" />
              <i-custom-delete-active class="select-item-delete-active" />
            </div>
          </li>
        </ul>
      </el-scrollbar>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';

const props = defineProps<{
  modelValue: Array<string>;
  isShowViewBtn?: boolean;
  placeholder?: string;
  viewText?: string;
  filterSystem?: boolean;
  isBooleanTextDisabled?: boolean;
}>();
const model = useVModel(props, 'modelValue');
const dialogVisible = ref(false);
const measurementList = ref<StorageDevice.MeasurementDataItem[]>([]);

const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementAllObjList);

let lastMeasurementQuery = '';
const remoteMethod = debounce((query: string) => {
  lastMeasurementQuery = query;
  getMeasurement(lastMeasurementQuery).then((res) => {
    if (lastMeasurementQuery === query) {
      let measurements = res.data?.measurements || [];
      if (props.filterSystem) {
        measurements = measurements.filter((item) => !item.timeseries.startsWith('root.__system'));
      }
      measurementList.value = measurements;
    }
  });
}, 500);

function handleDelete(index: number) {
  model.value?.splice(index, 1);
}
onMounted(() => {
  remoteMethod('');
});
</script>

<style scoped lang="scss">

.remote-select-box{
  position: relative;

  :deep(.el-select-v2__wrapper){
    padding-left: 20px;
  }

  :deep(.el-select-v2__tags-text) {
    max-width: 120px !important;
  }

  :deep(.el-select__tags) {
    flex-wrap: nowrap;
  }

  :deep(.el-select-tags-wrapper.has-prefix) {
    padding-left: 24px;
    display: flex;
    flex-wrap: nowrap;
  }

  :deep(.el-tag) {
    height: 16px !important;
  }

  :deep(.el-select__tags-text) {
    max-width: 120px !important;
  }

  :deep(.el-input__suffix){
    background: transparent;
  }
}

.select-list{
  .select-item{
    font-size: 12px;
    font-weight: 300;
    line-height: 24px;
    color: #656A85;
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;

    .select-item-text{
      display: inline-flex;
      width: 460px;
    }

    .select-item-delete-box{
      position: absolute;
      top: 3px;
      right: 4px;
      display: none;

      svg{
        width: 16px;
        height: 16px;
      }

      .select-item-delete-active{
        display: none;
      }

      &:hover {
        .select-item-delete{
          display: none;
        }

        .select-item-delete-active{
          display: block;
        }
      }
    }

    &:hover{
      background-color: #F7F8FC;
      color: #495AD4;

      .select-item-delete-box{
        display: block;
      }
    }
  }
}

.remote-select-search-text{
  display: flex;
  width: 200px;
}
</style>
