<template>
  <el-dialog
    :title="t('auth.systemInfo')"
    v-model="dialogVisible"
    width="265px"
    align-center
    :close-on-click-modal="false"
    id="system-modal"
    class="system-dialog"
  >
    <div class="system-info-box">
      <img src="@/assets/timecho-logo.svg" alt="" class="system-logo">
      <p class="system-title">{{ t('auth.systemTitle') }}</p>
      <p class="system-version">{{ t('auth.versionTitle', { version: appVersion }) }}</p>
      <p class="system-detail">{{ t('auth.systemDetail') }}</p>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import useAppStore from '@/stores/app';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
}>();

const { t } = useI18n();
const appStore = useAppStore();
const dialogVisible = useVModel(props, 'visible', emit);
const appVersion = computed(() => appStore.AppVersion);

</script>

<style lang="scss">
.system-dialog{
  border-radius: 4px !important;
}
</style>

<style lang="scss" scoped>
.system-info-box{
  display: flex;
  flex-direction: column;
  align-items: center;

  .system-logo{
    width: 120px;
    height: 32px;
  }

  .system-title{
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #424561;
    margin: 12px 0 4px;
  }

  .system-version {
    font-size: 12px;
    font-weight: 300;
    line-height: 18px;
    color: #656A85;
  }

  .system-detail {
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #656A85;
    margin: 24px 0 0;
  }
}
</style>
