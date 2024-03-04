<template>
  <el-dialog
    :title="t('dashboard.activeDetail')"
    v-model="dialogVisible"
    width="480px"
    align-center
    :close-on-click-modal="false"
    id="active-modal"
  >
    <ul>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activationExpirationTime') }}</span>
        <span class="active-info-content"></span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeDataNodeNum') }}</span>
        <span class="active-info-content"></span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeAlNodeNum') }}</span>
        <span class="active-info-content"></span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeCpuNum') }}</span>
        <span class="active-info-content"></span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeDeviceNum') }}</span>
        <span class="active-info-content"></span>
      </li>
      <li class="active-info-item">
        <span class="active-info-label">{{ t('dashboard.activeMeasurementNum') }}</span>
        <span class="active-info-content"></span>
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
