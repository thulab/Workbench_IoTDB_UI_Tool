<template>
  <el-dialog :title="t('dashboard.activeDetail')" v-model="dialogVisible" width="624px" align-center :close-on-click-modal="false" id="active-modal" class="active-modal">
    <div class="page-table-box">
      <el-table :data="tableData" v-loading="loading" style="width: 100%" tooltip-effect="light" ref="tableRef" border :tooltip-options="{ popperClass: 'table-tooltip-max-width' }">
        <el-table-column prop="name" min-width="170" align="center" show-overflow-tooltip>
          <template #header></template>
          <template #default="{ row }">{{ t(row.name) }}</template>
        </el-table-column>
        <el-table-column :label="t('dashboard.used')" prop="used" min-width="170" align="center" show-overflow-tooltip />
        <el-table-column :label="t('dashboard.allocated')" prop="allocated" min-width="180" align="center" show-overflow-tooltip />
      </el-table>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { DashboardApi } from '@/api';

const props = defineProps<{
  visible: boolean;
  isMaster: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const tableData = ref<Array<{ name: string; used: string; allocated: string }>>([]);

const { requestFn: getActiveInfo, loading } = useRequest(DashboardApi.getActiveInfo);

function getDetail() {
  getActiveInfo(props.isMaster).then((res) => {
    const { activationTime, datanodeNum, ainodeNum, cpuNum, deviceNum, measurementNum } = res.data;
    tableData.value.push({ name: 'dashboard.activationExpirationTime', used: '', allocated: activationTime });
    tableData.value.push({ name: 'dashboard.activeDataNodeNum', used: datanodeNum.split('/')[0], allocated: datanodeNum.split('/')[1] });
    tableData.value.push({ name: 'dashboard.activeAlNodeNum', used: ainodeNum.split('/')[0], allocated: ainodeNum.split('/')[1] });
    tableData.value.push({ name: 'dashboard.activeCpuNum', used: cpuNum.split('/')[0], allocated: cpuNum.split('/')[1] });
    tableData.value.push({ name: 'dashboard.activeDeviceNum', used: deviceNum.split('/')[0], allocated: deviceNum.split('/')[1] });
    tableData.value.push({ name: 'dashboard.activeMeasurementNum', used: measurementNum.split('/')[0], allocated: measurementNum.split('/')[1] });
  });
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      tableData.value = [];
      getDetail();
    }
  }
);
</script>

<style lang="scss" scoped>
.page-table-box {
  padding: 16px;
  background-color: #f7f8fc;
  border-radius: 2px;
  min-height: 240px;

  :deep(.el-table th.el-table__cell) {
    background-color: #fff !important;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #424561;
  }

  :deep(.el-table .cell) {
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #424561;
  }
}

.active-info-item {
  display: flex;
  min-height: 32px;
  align-items: center;

  .active-info-label {
    flex: 60%;
    text-align: right;
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #424561;
  }

  .active-info-content {
    font-size: 12px;
    font-weight: 300;
    line-height: 18px;
    color: #656a85;
    flex: 40%;
    text-align: center;
  }
}
</style>
