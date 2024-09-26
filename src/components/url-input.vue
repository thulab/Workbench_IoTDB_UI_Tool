<template>
  <el-input class="url-input" v-model="form.host">
    <template #prepend>
      <el-select v-model="form.protocol">
        <el-option label="http://" value="http://" />
        <el-option label="https://" value="https://" />
      </el-select>
    </template>
    <template #append>
      <el-input class="append-input" disabled v-model="form.pathname" />
    </template>
  </el-input>
</template>

<script setup lang="ts">
// 使用 defineModel 来定义 v-model
const modelValue = defineModel<string>();

const form = ref({
  protocol: 'http://',
  host: '',
  pathname: '/api/v1/query',
});
const sanitizeUrl = (url: string) => {
  return url.replace(/\/{2,}/g, '/');
};

const fullUrl = computed({
  get() {
    if (!form.value.host) {
      return '';
    }
    return form.value.protocol + sanitizeUrl(`${form.value.host.trim()}${form.value.pathname.trim()}`);
  },
  set(value: string) {
    if (value) {
      if (value.startsWith('https://')) {
        form.value.protocol = 'https://';
      } else {
        form.value.protocol = 'http://';
      }
      const url = value.replaceAll(form.value.protocol, '');
      const splitIndex = url.indexOf('/');
      form.value.host = url.substring(0, splitIndex);
      form.value.pathname = url.substring(splitIndex);
    } else {
      form.value.protocol = 'http://';
      form.value.host = '';
      form.value.pathname = '/api/v1/query';
    }
    modelValue.value = form.value.host ? value : '';
  },
});

// 监听 form 的变化并更新 fullUrl
watch(
  () => form.value,
  (newForm) => {
    if (newForm.host) {
      modelValue.value = form.value.protocol + sanitizeUrl(`${form.value.host.trim()}${form.value.pathname.trim()}`);
    } else {
      modelValue.value = '';
    }
  },
  { deep: true }
);

watch(
  () => modelValue.value,
  (newValue) => {
    fullUrl.value = newValue || '';
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.url-input {
  :deep(.el-input-group__append),
  :deep(.el-input-group__prepend) {
    padding: 0 !important;

    .el-select {
      margin: 0;
      width: 70px;
    }

    .append-input {
      .el-input__wrapper {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        box-shadow:
          -1px 0 0 0 var(--el-input-border-color) inset,
          0 1px 0 0 var(--el-input-border-color) inset,
          0 -1px 0 0 var(--el-input-border-color) inset;
        background-color: #f0f1fa !important;

        .el-input__inner {
          border-left: 0 !important;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
      }

      width: 110px;
    }
  }
}
</style>
