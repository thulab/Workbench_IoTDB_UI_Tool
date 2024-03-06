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
    <ul>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activationExpirationTime') }}:</span>
        <span class="active-info-content"></span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeDataNodeNum') }}:</span>
        <span class="active-info-content"></span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeAlNodeNum') }}:</span>
        <span class="active-info-content">-</span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeCpuNum') }}:</span>
        <span class="active-info-content"></span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeDeviceNum') }}:</span>
        <span class="active-info-content"></span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeMeasurementNum') }}:</span>
        <span class="active-info-content">50000/25000</span>
      </li>
    </ul>
  </el-dialog>
</template>

<script lang="ts" setup>

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const { t } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      console.log(newVal);
    }
  },
);

</script>

<style lang="scss">
.active-modal{
  border-radius: 4px !important;
}
</style>

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
