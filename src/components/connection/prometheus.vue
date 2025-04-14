<template>
  <base-form-item :prop="formKey" :class="className">
    <template #label>
      {{ t('connection.prometheus') }}：
      <el-tooltip effect="light" :content="t('connection.prometheusTip')" placement="top" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
    </template>
    <el-col :span="19">
      <url-input class="m-l-[8px] p-r-[16px]" v-model.trim="prometheusUrl" :placeholder="`${t('common.placeHolder')}IP:Port`" :id="`${formKey}-prometheusUrl`" />
    </el-col>
    <el-col :span="5">
      <el-switch
        v-model="enableAuth"
        @change="
          (val) => {
            if (!val) {
              username = '';
              password = '';
            }
          }
        "
        inline-prompt
        size="default"
        style="--el-switch-on-color: #495ad4; --el-switch-off-color: #f0f1fa"
        :style="{ color: enableAuth ? '#fff' : '#424561' }"
        :class="[{ 'switch-off': !enableAuth }]"
        :active-text="t('connection.enableAuth')"
        :inactive-text="t('connection.disableAuth')"
      />
      <!-- <ul class="switch-list">
        <li :class="['switch-type', { 'switch-active': enableAuth }]" id="switch-type-running" @click="handleAuthSwitch">{{ t('connection.enableAuth') }}</li>
        <li :class="['switch-type', { 'switch-active': !enableAuth }]" id="switch-type-history" @click="handleAuthSwitch">{{ t('connection.disableAuth') }}</li>
      </ul> -->
    </el-col>
  </base-form-item>
  <el-row v-if="enableAuth || username" class="p-r-28">
    <el-col :span="15">
      <base-form-item :prop="formKeyUsername" class="p-l-[7px]" :label="`${t('connection.prometheusUsername')}：`" :rules="requiredRules" label-position="right">
        <el-input class="m-l-[0] m-r-[8px]" v-model="username" :placeholder="t('connection.prometheusUsernameTip')" maxlength="32" id="connection-modal-username" />
      </base-form-item>
    </el-col>
    <el-col :span="9">
      <base-form-item :prop="formKeyPassword" :label="`${t('connection.prometheusPassword')}：`" label-width="50px" label-position="right">
        <el-input v-model="password" :placeholder="t('connection.prometheusPasswordTip')" show-password autocomplete="off" id="connection-modal-password" class="promethus-password-input" />
      </base-form-item>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  formKey: string;
  formKeyUsername: string;
  formKeyPassword: string;
  className: string[] | string;
}>();

const { t } = useI18n();

const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: 'blur',
  },
]);

const prometheusUrl = useVModel(props, 'modelValue');
const username = defineModel('username', {
  type: String,
  default: '',
});
const password = defineModel('password', {
  type: String,
  default: '',
});

const enableAuth = ref(false);
</script>

<style lang="scss" scoped>
.switch-list {
  display: inline-flex;
  margin: 0 16px 0 0;
  border-radius: 12px;
  background-color: #f0f1fa;
  padding: 4px;

  .switch-type {
    padding: 3px 12px 3px 8px;
    cursor: pointer;
    border-radius: 12px;
    background-color: transparent;
    font-size: 12px;
    line-height: 12px;
    font-weight: 300;
    color: #656a85;
    white-space: nowrap;
  }

  .switch-active {
    background-color: #495ad4;
    color: #fff;
    padding: 3px 12px;
  }
}
</style>
<style lang="scss">
.switch-off {
  .el-switch__core .el-switch__inner .is-text {
    color: #424561;
  }
}

.promethus-password-input {
  padding-right: 8px;
}

.el-collapse-item__content {
  .promethus-password-input {
    padding-right: 0;
  }
}
</style>
