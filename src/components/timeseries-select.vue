<template>
  <div>
    <el-select-v2
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
      placeholder="请选择测点" />
    <el-button type="primary" class="m-l-12" @click="()=>dialogVisible = true">查看测点</el-button>
    <el-dialog title="已选测点" v-model="dialogVisible" class="select-modal">
      <ul class="select-list">
        <li v-for="item in model" :key="item" class="select-item">{{ item }}</li>
      </ul>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { StorageApi } from '@/api';

const props = defineProps<{
  modelValue: Array<String> | String;
  serverId: number
}>();
const model = useVModel(props, 'modelValue');
const dialogVisible = ref(false);

const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementList);

const options = ref<Array<{ label: string; value: string }>>([]);
let lastMeasurementQuery = '';
const remoteMethod = (query: string) => {
  lastMeasurementQuery = query;
  getMeasurement({
    serverId: props.serverId,
    deviceName: 'root.sg1.d1',
    keyword: lastMeasurementQuery,
  }).then((res) => {
    if (lastMeasurementQuery === query) {
      options.value = res.data?.pathNames.map((item) => ({ label: item, value: item })) || [];
    }
  });
};
</script>

<style scoped lang="scss">

:deep(.el-dialog__header) {
  margin-left: 16px;
  border-bottom: 1px solid #DFE1ED;
  padding-left: 0;
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
