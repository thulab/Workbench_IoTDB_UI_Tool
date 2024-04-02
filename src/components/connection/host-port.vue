<template>
  <div class="ip-port-list">
    <div class="ip-port-item" v-for="(item, index) in hostAndPortList" :key="`${formKey}-${index}`">
      <base-form-item label="" :prop="`${formKey}[${index}].host`" :rules="requiredRules">
        <el-input v-model.trim="item.host" :placeholder="t('connection.ipTip')" style="width: 200px" :id="`${formKey}-${index}-host`" :disabled="!isDisabled" />
      </base-form-item>
      <span class="ip-port-divider">:</span>
      <base-form-item label="" :prop="`${formKey}[${index}].port`" :rules="requiredPortRules">
        <el-input v-model.number="item.port" :placeholder="t('connection.portTip')" :style="{ width: locale === 'en' ? '108px' : '148px' }" :id="`${formKey}-${index}-port`" :disabled="!isDisabled" />
      </base-form-item>
      <template v-if="showOperate">
        <el-button
          link
          v-if="index === 0"
          @click="handleAddHost"
          :id="`${formKey}-add`"
          :class="['m-l-6', isDisabledAddHosts || !isDisabled ? '' : 'svg-button-hover-color']"
          :disabled="isDisabledAddHosts || !isDisabled"
        >
          <el-icon size="26"><i-custom-add-border /></el-icon>
        </el-button>
        <el-button link v-if="index !== 0" @click="handleDelHost(index)" :id="`${formKey}-del`" :class="['m-l-6', !isDisabled ? '' : 'svg-button-hover-color']" :disabled="!isDisabled">
          <el-icon size="26"><i-custom-delete /></el-icon>
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: Array<{ host: string; port: number | string }>;
  formKey: string;
  className?: string[] | string;
  isDisabled: boolean;
  showOperate?: boolean;
}>();

const { t, locale } = useI18n();
const hostAndPortList = useVModel(props, 'modelValue');

const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: ['blur', 'change'],
  },
]);

const requiredPortRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: ['blur', 'change'],
  },
  {
    validator: (rule: any, value: any, callback: any) => {
      if (!/^\+?[1-9][0-9]*$/.test(`${value}`)) {
        return callback(new Error(t('common.errorTip')));
      }
      if (value > 65535) {
        return callback(new Error(t('common.errorTip')));
      }
      return callback();
    },
    trigger: ['blur', 'change'],
  },
]);

const isDisabledAddHosts = computed(() => {
  const hosts = hostAndPortList.value;
  const flag = hosts.some((item) => !item.host || !item.port);
  return flag;
});

function handleAddHost() {
  hostAndPortList.value.push({ host: '', port: '' });
}

function handleDelHost(index: number) {
  hostAndPortList.value.splice(index, 1);
}
</script>

<style lang="scss" scoped>
.ip-port-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;

  :deep(.el-form-item__label) {
    width: 0 !important;
    padding: 0 !important;
  }
}

.ip-port-item {
  display: flex;

  .ip-port-divider {
    width: 20px;
    text-align: center;
    margin-top: 5px;
  }
}
</style>
