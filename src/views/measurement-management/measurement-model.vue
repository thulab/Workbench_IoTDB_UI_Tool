<template>
  <el-container class="page-container">
    <el-header class="detail-title-box">
      <h4 class="detail-title-text">数据模型</h4>
      <el-button link @click="handleRefresh"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
    </el-header>
    <el-main class="p-0">
      <el-scrollbar>
        <div class="chart-container-box">
          <the-chart :option="treeDataOptions" key="memoryChart" />
        </div>
      </el-scrollbar>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { type ECOption } from '@/plugins/echarts-plugin';

const treeDataOptions = computed<ECOption>(() => ({}));

// 刷新
function handleRefresh() {}
</script>

<style lang="scss" scoped>
.detail-title-box{
  height: 48px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #DFE1ED;
  padding: 0 16px;
  box-sizing: border-box;

  .detail-title-text{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
}
</style>
