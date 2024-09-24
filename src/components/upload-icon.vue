<template>
  <div class="upload-icon">
    <el-icon size="16" :class="{ 'is-loading': status === 1 }" class="m-r-4">
      <i-custom-loading-wait v-if="status === 0" />
      <i-custom-loading v-else-if="status === 1" />
      <i-custom-upload-success v-else-if="status === 2" />
      <i-custom-upload-error v-else />
    </el-icon>
    {{ formatedStatus }}
  </div>
</template>
<script setup lang="ts">
const { t } = useI18n();

const props = defineProps<{
  status: 0 | 1 | 2 | -1;
  type: 'upload' | 'import';
}>();

const formatedStatus = computed(() => {
  if (props.type === 'upload') {
    switch (props.status) {
      case 0:
        return t('measurement.waitingUpload');
      case 1:
        return t('measurement.uploading');
      case 2:
        return t('measurement.uploaded');
      case -1:
        return t('measurement.uploadFailed');
      default:
        return t('measurement.waitingUpload');
    }
  } else {
    switch (props.status) {
      case 0:
        return t('measurement.waitingImport');
      case 1:
        return t('measurement.importing');
      case 2:
        return t('measurement.imported');
      case -1:
        return t('measurement.importFailed');
      default:
        return t('measurement.waitingImport');
    }
  }
});
</script>
<style lang="scss">
.upload-icon {
  display: flex;
  align-items: center;
  width: 70px;

  &:lang(en) {
    width: 96px;
  }
}
</style>
