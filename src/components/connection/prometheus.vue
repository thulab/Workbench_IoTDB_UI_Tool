<template>
  <base-form-item :prop="formKey" :class="className">
    <template #label>
      {{ t('connection.prometheus') }}：
      <el-tooltip effect="light" :content="t('connection.prometheusTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
    </template>
    <url-input v-model.trim="prometheusUrl" :placeholder="`ip:port`" :id="`${formKey}-prometheusUrl`" />
  </base-form-item>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  formKey: string;
  className: string[] | string;
}>();

const { t } = useI18n();
const prometheusUrl = useVModel(props, 'modelValue');
</script>
