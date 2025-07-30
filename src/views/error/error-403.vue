<template>
  <div class="error-container">
    <!-- <img src="@/assets/images/403.png" class="error-img" alt="403" /> -->
    <div class="error-detail">
      <h2>403</h2>
      <h4>{{ t('error.403Tip') }}~🙅‍♂️🙅‍♀️</h4>
      <el-button type="primary" @click="tabStore.goHome()">
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
@use './error';
</style>
