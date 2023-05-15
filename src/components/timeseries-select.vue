<template>
  <div>
    <el-select-v2
      v-model="model"
      style="width: 240px"
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
    <el-button type="primary" class="m-l-12" @click="()=>dialogVisible = true">已选测点</el-button>
    <el-dialog title="已选测点" v-model="dialogVisible">
      <el-form :model="formData" :inline="false" label-width="120px">
        <el-form-item label="选择存储组" prop="database">
          <el-select placeholder="请选择存储组" />
        </el-form-item>
        <el-form-item label="查询维度">
          <el-radio label="按设备查询" />
          <el-radio label="按物理量查询" />
        </el-form-item>
      </el-form>
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

const formData = reactive({
  database: '',
  device: '',
  physical: '',
});
const options = ref<Array<{ label: string; value: string }>>([]);
let lastMeasurementQuery = '';
const remoteMethod = (query: string) => {
  lastMeasurementQuery = query;
  getMeasurement({
    serverId: props.serverId,
    deviceName: 'root.dacoo.deviceS12410',
    keyword: lastMeasurementQuery,
  }).then((res) => {
    if (lastMeasurementQuery === query) {
      options.value = res.data?.pathNames.map((item) => ({ label: item, value: item })) || [];
    }
  });
};
</script>
