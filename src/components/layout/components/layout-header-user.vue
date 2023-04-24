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
import { ElMessageBox } from 'element-plus';
import { computed } from 'vue';
import { useLoginStore } from '@/stores/login.store';

const loginStore = useLoginStore();
const userName = computed(() => loginStore.userInfo.name || 'root');

const logout = () => {
  ElMessageBox.confirm('您是否确认退出登录?', '温馨提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    loginStore.isLogin = false;
    localStorage.setItem('authorization', '');
    loginStore.logoutSSO();
  });
};

const handleLoginCommand = (val: string) => {
  switch (val) {
    case 'logout': {
      logout();
      break;
    }
    default:
      break;
  }
}
</script>

<style lang="scss" scoped>
.username {
  font-size: 15px;
  color: var(--el-text-color-primary);
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
