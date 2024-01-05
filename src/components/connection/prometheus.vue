<template>
  <base-form-item label="Prometheus 信息：" :prop="formKey" :class="className">
    <template #label>
      Prometheus 信息：<el-tooltip effect="light" content="配置prometheus可在界面查看部分监控信息，推荐您进行配置使用" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
    </template>
    <el-input v-model.trim="prometheusUrl" placeholder="例如：http://ip:port/api/v1/query" :id="`${formKey}-prometheusUrl`" />
  </base-form-item>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  formKey: string;
  className: string[] | string;
}>();

const prometheusUrl = useVModel(props, 'modelValue');
</script>
