<template>
  <base-form-item :label="`${t('auth.userName')}：`" prop="username" :rules="requiredUserRules" class="base-form-box">
    <el-input v-model="username" :placeholder="t('auth.userNamePlaceholder')" maxlength="32" id="connection-modal-username" :disabled="!isDisabled" />
  </base-form-item>
  <base-form-item :label="`${t('auth.pwd')}：`" prop="password" class="optional-form-item base-form-box" :error="errorPwd">
    <el-input v-model="password" :placeholder="t('auth.pwdPlaceholder')" show-password autocomplete="off" id="connection-modal-password" :disabled="!isDisabled" />
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
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: 'blur',
  },
  {
    min: 4,
    max: 32,
    message: () => t('auth.userNameLength'),
    trigger: 'blur',
  },
  {
    pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=]+$/,
    message: () => t('common.errorExg'),
    trigger: 'blur',
  },
]);
</script>

<style lang="scss" scoped>
.base-form-box {
  padding: 0 36px 0 7px;
}

.optional-form-item {
  :deep(.el-form-item__label) {
    padding-left: 9px;
  }
}
</style>
