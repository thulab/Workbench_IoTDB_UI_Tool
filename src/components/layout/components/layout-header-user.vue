<template>
  <el-dropdown @command="handleLoginCommand">
    <span class="username">{{ userName }}</span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="reset">
          重置密码
        </el-dropdown-item>
        <el-dropdown-item command="logout">
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

const userStore = useUserStore();
const userName = computed(() => userStore.userInfo.name || 'root');
const modalVisible = ref(false);

const { requestFn: logout } = useRequest(UserApi.logout);

const handleLogout = () => {
  ElMessageBox.confirm('您是否确认退出登录?', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    logout().then(() => {
      window.location.href = '/login';
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
</script>

<style lang="scss" scoped>
.username {
  font-size: 15px;
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
