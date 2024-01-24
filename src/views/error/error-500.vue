<template>
  <div class="error-container">
    <!-- <img src="@/assets/images/500.png" class="error-img" alt="500" /> -->
    <div class="error-detail">
      <h2>500</h2>
      <h4>{{ t('error.500Tip') }}~🤦‍♂️🤦‍♀️</h4>
      <el-button
        type="primary"
        @click="tabStore.goHome()">
        {{ t('error.goHome') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import useTabsStore from '@/stores/tabs';

const { t } = useI18n();
const tabStore = useTabsStore();
</script>

<style scoped lang="scss">
@import "./error";
</style>
