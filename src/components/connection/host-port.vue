<template>
  <div class="ip-port-list">
    <div class="ip-port-item" v-for="(item, index) in hostAndPortList" :key="`${formKey}-${index}`">
      <base-form-item label="" :prop="`${formKey}[${index}].host`" :rules="requiredRules">
        <el-input v-model.trim="item.host" placeholder="请输入数据库Host或IP" style="width: 169px" :id="`${formKey}-${index}-host`" :disabled="!isDisabled" />
      </base-form-item>
      <span class="ip-port-divider">:</span>
      <base-form-item label="" :prop="`${formKey}[${index}].port`" :rules="requiredPortRules">
        <el-input v-model.number="item.port" placeholder="请输入端口号" style="width: 100px" :id="`${formKey}-${index}-port`" :disabled="!isDisabled" />
      </base-form-item>
      <template v-if="showOperate">
        <el-button link v-if="index === 0" @click="handleAddHost" :id="`${formKey}-add`" class="m-l-6" :disabled="isDisabledAddHosts || !isDisabled"><el-icon size="26"><i-custom-add-border /></el-icon></el-button>
        <el-button link v-if="index !== 0" @click="handleDelHost(index)" :id="`${formKey}-del`" class="m-l-6" :disabled="!isDisabled"><el-icon size="26"><i-custom-delete /></el-icon></el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: Array<{ host: string, port: number | string }>;
  formKey: string;
  className?: string[] | string;
  isDisabled: boolean;
  showOperate?: boolean;
}>();

const hostAndPortList = useVModel(props, 'modelValue');

const requiredRules = ref([
  {
    required: true,
    message: '请输入内容后操作',
    trigger: ['blur', 'change'],
  },
]);

const requiredPortRules = ref([
  {
    required: true,
    message: '请输入内容后操作',
    trigger: ['blur', 'change'],
  },
  {
    validator: (rule: any, value: any, callback: any) => {
      if (!/^\+?[1-9][0-9]*$/.test(`${value}`)) {
        return callback(new Error('输入有误'));
      }
      if (value > 65535) {
        return callback(new Error('输入有误'));
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
.ip-port-list{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    flex: 1;

    :deep(.el-form-item__label) {
      width: 0 !important;
      padding: 0 !important;
    }
  }

  .ip-port-item{
    display: flex;

    .ip-port-divider{
      width: 28px;
      text-align: center;
      margin-top: 5px;
    }
  }
</style>
