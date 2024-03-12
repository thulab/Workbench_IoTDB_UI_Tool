<template>
  <el-dialog
    :title="t('dashboard.activeDetail')"
    v-model="dialogVisible"
    width="370px"
    align-center
    :close-on-click-modal="false"
    id="active-modal"
    class="active-modal"
  >
    <ul v-loading="loading">
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activationExpirationTime') }}:</span>
        <span class="active-info-content">{{ activeData.activationTime }}</span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeDataNodeNum') }}:</span>
        <span class="active-info-content">{{ activeData.datanodeNum }}</span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeAlNodeNum') }}:</span>
        <span class="active-info-content">{{ activeData.ainodeNum }}</span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeCpuNum') }}:</span>
        <span class="active-info-content">{{ activeData.cpuNum }}</span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeDeviceNum') }}:</span>
        <span class="active-info-content">{{ activeData.deviceNum }}</span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeMeasurementNum') }}:</span>
        <span class="active-info-content">{{ activeData.measurementNum }}</span>
      </li>
    </ul>
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
const activeData = reactive<Dashboard.ActiveData>({
  activationTime: '',
  datanodeNum: '',
  cpuNum: '',
  deviceNum: '',
  measurementNum: '',
  ainodeNum: '',
});

const { requestFn: getActiveInfo, loading } = useRequest(DashboardApi.getActiveInfo);

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      getActiveInfo(props.isMaster).then((res) => {
        activeData.activationTime = res.data.activationTime || '-';
        activeData.datanodeNum = res.data.datanodeNum || '-';
        activeData.cpuNum = res.data.cpuNum || '-';
        activeData.deviceNum = res.data.deviceNum || '-';
        activeData.measurementNum = res.data.measurementNum || '-';
        activeData.ainodeNum = res.data.ainodeNum || '-';
      });
    }
  },
);

</script>

<style lang="scss" scoped>
.active-info-item{
  display: flex;
  min-height: 32px;
  align-items: center;

  .active-info-label{
    flex: 60%;
    text-align: right;
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #424561;
  }

  .active-info-content{
    font-size: 12px;
    font-weight: 300;
    line-height: 18px;
    color: #656A85;
    flex: 40%;
    text-align: center;
  }
}
</style>
