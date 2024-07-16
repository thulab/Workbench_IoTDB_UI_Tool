<template>
  <el-dialog :title="t('auth.addPath')" v-model="dialogVisible" :width="locale === 'en' ? '598px' : '498px'" align-center :close-on-click-modal="false" id="auth-path-modal">
    <el-radio-group v-model="pathType" class="path-radio-group m-y-6">
      <div class="flex">
        <el-radio :value="'select'" id="auth-path-modal-select-radio">
          <span class="radio-label">
            {{ t('auth.exactPath') }}：
            <el-tooltip effect="light" :content="t('common.searchTipLimit100')" placement="bottom" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
          </span>
        </el-radio>
        <div class="search-path-box">
          <timeseries-select-single
            id="auth-path-modal-select-path"
            ref="timeseriesSelectSingleRef"
            v-model="selectPath"
            :selectWidth="locale === 'en' ? 448 : 360"
            :itemWidth="locale === 'en' ? 418 : 330"
            :is-clearable="true"
            class="path-select"
            :filter-system="true"
            :placeholder="t('auth.exactPathPlaceholder')"
            :disabled-path="() => false"
          />
        </div>
      </div>
      <el-radio :value="'input'" id="auth-path-modal-input-radio">
        <span class="radio-label">
          {{ t('auth.pathMode') }}：
          <el-tooltip effect="light" :content="t('auth.pathModeTip')" placement="bottom" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
        </span>
        <el-input v-model="inputPath" :placeholder="t('auth.pathModePlaceholder')" :style="{ width: locale === 'en' ? '448px' : '360px' }" class="path-input" id="auth-path-modal-input-path">
          <!-- <template #prepend>root.</template> -->
        </el-input>
      </el-radio>
    </el-radio-group>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" id="auth-path-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm" id="auth-path-modal-confirm">{{ t('common.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import TimeseriesSelectSingle from '@/components/timeseries-select-single.vue';

const props = defineProps<{
  visible: boolean;
  pathList: string[];
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave', payload: string): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const { t, locale } = useI18n();
const pathType = ref('select');
const inputPath = ref('');
const selectPath = ref('');
const timeseriesSelectSingleRef = ref<InstanceType<typeof TimeseriesSelectSingle>>();

const handleConfirm = () => {
  let res = selectPath.value;
  if (pathType.value === 'input') {
    const validInputRes = inputPath.value.replace(/(\s*$)/g, '');
    if (validInputRes.endsWith('.') || (validInputRes.endsWith('*') && !validInputRes.endsWith('**'))) {
      ElMessage.warning({ message: t('auth.pathEndTip'), grouping: true });
      return;
    }
    inputPath.value = validInputRes;
    res = inputPath.value;
  }
  if (!res) {
    ElMessage.error({ message: t('auth.pathEmptyRule'), grouping: true });
    return;
  }
  // if (pathType.value === 'input') {
  //   res = `root.${inputPath.value}`;
  // }
  const flag = props.pathList.some((item) => item === res);
  if (flag) {
    ElMessage.error({ message: t('auth.pathExistTip'), grouping: true });
    return;
  }
  dialogVisible.value = false;
  emit('handleSave', res);
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        pathType.value = 'select';
        inputPath.value = '';
        selectPath.value = '';
      });
    }
  }
);
</script>

<style lang="scss" scoped>
.radio-label {
  position: relative;
  width: 84px;
  display: inline-flex;
  text-align: left;

  &:lang(en) {
    width: 96px;
  }
}

.search-path-box {
  display: inline-flex;
}

.path-radio-group {
  :deep(.el-radio) {
    margin: 0 0 20px;
  }

  :deep(.el-radio:last-child) {
    margin: 0;
  }

  :deep(.el-radio__label) {
    display: inline-flex;
    align-items: center;
  }
}

.path-type-select {
  :deep(.el-input__wrapper) {
    background-color: #f0f1fa;
  }

  :deep(.el-input__inner) {
    color: #131926;
  }

  :deep(.el-select-v2__wrapper) {
    background-color: #f0f1fa;
  }

  :deep(.el-select-v2__placeholder) {
    color: #131926 !important;
  }
}

.path-select {
  :deep(.el-input__suffix) {
    background-color: transparent;
  }
}

.path-input {
  :deep(.el-input-group__prepend) {
    width: 40px;
    padding: 0;
  }
}
</style>
