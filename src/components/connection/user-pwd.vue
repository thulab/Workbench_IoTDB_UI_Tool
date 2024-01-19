<template>
  <base-form-item label="用户名：" prop="username" :rules="requiredUserRules" class="base-form-box">
    <el-input v-model="username" placeholder="请输入用户名" maxlength="32" id="connection-modal-username" :disabled="!isDisabled" />
  </base-form-item>
  <base-form-item label="密码：" prop="password" class="optional-form-item base-form-box" :error="errorPwd">
    <el-input v-model="password" placeholder="请输入密码" show-password autocomplete="off" id="connection-modal-password" :disabled="!isDisabled" />
  </base-form-item>
</template>

<script setup lang="ts">
defineProps<{
  isDisabled: boolean;
}>();

const { t } = useI18n();
const username = defineModel<string>('username');
const password = defineModel<string>('password');
const errorPwd = defineModel<string>('errorPwd');

const requiredUserRules = ref([
  {
    required: true,
    message: t('common.formRuleEmptyOperate'),
    trigger: ['blur', 'change'],
  },
  {
    min: 4,
    max: 32,
    message: '字符长度不小于4，请重新输入',
    trigger: ['blur', 'change'],
  },
  {
    pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
    message: '格式不符，请重新输入',
    trigger: ['blur', 'change'],
  },
]);
</script>

<style lang="scss" scoped>
.base-form-box{
  padding: 0 36px 0 7px;
}

.optional-form-item{
  :deep(.el-form-item__label){
    padding-left: 9px;
  }
}
</style>
