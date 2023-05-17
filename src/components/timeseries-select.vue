<template>
  <div>
    <el-select-v2
      class="remote-select-box"
      v-model="model"
      style="width: 260px"
      filterable
      remote
      :remote-method="remoteMethod"
      :loading="measurementLoading"
      :options="options"
      clearable
      multiple
      collapse-tags
      collapse-tags-tooltip
      placeholder="请选择测点">
      <template #prefix>
        <i-custom-search-icon class="remote-select-search-icon" />
      </template>
      <template #default="{ item }">
        <div class="remote-select-search-text">
          <text-tooltip :content="item.label" />
        </div>
      </template>
    </el-select-v2>
    <el-button v-if="isShowViewBtn" plain class="m-l-12" @click="()=>dialogVisible = true">已选测点</el-button>
    <el-dialog title="已选测点" v-model="dialogVisible" class="select-modal">
      <ul class="select-list">
        <li v-for="item in model" :key="item" class="select-item">{{ item }}</li>
      </ul>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { debounce } from 'lodash-es';
import { StorageApi } from '@/api';

const props = defineProps<{
  modelValue: Array<String> | String;
  serverId: number;
  isShowViewBtn?: boolean;
}>();
const model = useVModel(props, 'modelValue');
const dialogVisible = ref(false);

const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementAllList);

const options = ref<Array<{ label: string; value: string }>>([]);
let lastMeasurementQuery = '';
const remoteMethod = debounce((query: string) => {
  lastMeasurementQuery = query;
  getMeasurement(props.serverId, lastMeasurementQuery).then((res) => {
    if (lastMeasurementQuery === query) {
      options.value = res.data?.measurements?.map((item) => ({ label: item, value: item })) || [];
    }
  });
}, 500);
</script>

<style scoped lang="scss">

.remote-select-box{
  position: relative;

  :deep(.el-select-v2__wrapper) {
    padding-left: 20px;
  }

  :deep(.el-select-v2__tags-text) {
    max-width: 120px !important;
  }

  .remote-select-search-icon {
    position: absolute;
    top: 3px;
    left: 4px;
  }
}

.select-list{
  max-height: 400px;
  overflow-y: auto;

  .select-item{
    font-size: 12px;
    font-weight: 300;
    line-height: 24px;
    color: #656A85;
  }
}
</style>
<style lang="scss">
.remote-select-search-text{
  display: inline-flex;
  max-width: 200px;
}
</style>
