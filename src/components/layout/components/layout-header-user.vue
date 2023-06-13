<template>
  <el-dropdown @command="handleLoginCommand">
    <span class="username">{{ userName }}</span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="logout">
          退出登录
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLoginStore } from '@/stores/login.store';
import { UserApi } from '@/api';

const loginStore = useLoginStore();
const userName = computed(() => loginStore.userInfo.name || 'root');

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
    default:
      break;
  }
};
</script>

<style lang="scss" scoped>
.username {
  font-size: 15px;
  color: var(--el-text-color-primary);

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
