<template>
  <el-dialog :title="t('auth.systemInfo')" v-model="dialogVisible" width="320px" align-center :close-on-click-modal="false" id="system-modal" class="system-dialog">
    <div class="system-info-box">
      <p class="flex items-end">
        <i-custom-timecho-logo-en v-if="locale === 'en'" class="system-logo" />
        <i-custom-timecho-logo v-else class="system-logo" />
        <span class="logo-version system-info">2.x</span>
      </p>
      <p class="system-title">{{ systemTitle }}</p>
      <p class="system-version">{{ t('auth.versionTitle', { version: appVersion }) }}</p>
      <p class="system-detail">{{ systemDetail }}</p>
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

const { t, locale } = useI18n();
const appType = Number(import.meta.env.VITE_APP_TYPE);
const appStore = useAppStore();
const dialogVisible = useVModel(props, 'visible', emit);
const appVersion = computed(() => appStore.AppVersion);
const systemTitle = computed(() => (appType === 1 ? t('auth.systemTitle') : t('auth.systemTitleWorkbench')));
const systemDetail = computed(() => (appType === 1 ? t('auth.systemDetail') : t('auth.systemDetailWorkbench')));
</script>

<style lang="scss" scoped>
.system-info-box {
  display: flex;
  flex-direction: column;
  align-items: center;

  .system-logo {
    width: 120px;
    height: 32px;
  }

  .system-title {
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
    color: #656a85;
  }

  .system-detail {
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #656a85;
    margin: 24px 0 0;
  }
}
</style>
