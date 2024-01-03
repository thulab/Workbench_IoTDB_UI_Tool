<template>
  <el-dropdown @command="handleLoginCommand">
    <span class="username">{{ userName }}</span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="reset" id="layout-header-reset">
          重置密码
        </el-dropdown-item>
        <el-dropdown-item command="logout" id="layout-header-logout">
          退出登录
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <modal-reset-password title="重置密码" :user-name="userName" v-model:visible="modalVisible" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/stores';
import { UserApi } from '@/api';
import ModalResetPassword from '@/components/modal-reset-password.vue';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';

const userStore = useUserStore();
const userName = computed(() => userStore.userInfo.name);
const modalVisible = ref(false);

const { requestFn: logout } = useRequest(UserApi.logout);

const handleLogout = () => {
  ElMessageBox.confirm('您是否确认退出登录?', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  }).then(() => {
    logout().then(() => {
      userStore.setUser('');
      window.location.href = `/login?timestamp=${new Date().getTime()}`;
    });
  });
};

const handleLoginCommand = (val: string) => {
  switch (val) {
    case 'logout': {
      handleLogout();
      break;
    }
    case 'reset': {
      modalVisible.value = true;
      break;
    }
    default:
      break;
  }
};
onMounted(() => {
  userStore.loadPrivileges(true);
});
</script>

<style lang="scss" scoped>
.username {
  font-size: 15px;
  line-height: 1.2;
  color: var(--el-text-color-primary);
  max-width: 54px;
  overflow: hidden;
  text-overflow: ellipsis;

  &:focus-visible {
    outline: none;
  }
}

.avatar {
  width: 40px;
  height: 40px;
  margin: 0 0 0 20px;
  overflow: hidden;
  cursor: pointer;
  border-radius: 50%;

  img {
    width: 100%;
    height: 100%;
  }
}
</style>
