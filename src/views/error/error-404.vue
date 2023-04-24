<template>
  <div class="error-container">
    <!-- <img src="@/assets/images/404.png" class="error-img" alt="404" /> -->
    <div class="error-detail">
      <h2>404</h2>
      <h4>抱歉，您访问的页面不存在~🤷‍♂️🤷‍♀️</h4>
      <el-button
        type="primary"
        @click="tabStore.goHome()">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import useTabsStore from '@/stores/tabs';

const tabStore = useTabsStore();
</script>

<style scoped lang="scss">
@import "./error";
</style>
