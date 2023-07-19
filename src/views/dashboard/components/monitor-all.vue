<template>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box">
      <div class="monitor-chart-container"></div>
    </div>
    <div class="monitor-chart-box">
      <div class="monitor-chart-container"></div>
    </div>
    <div class="monitor-chart-box">
      <div class="monitor-chart-container"></div>
    </div>
    <div class="monitor-chart-box">
      <div class="monitor-chart-container"></div>
    </div>
    <div class="monitor-chart-box">
      <div class="monitor-chart-container"></div>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
.monitor-chart-wrapper{
  width: 100%;
  margin: 0 -8px;
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.monitor-chart-box{
  flex: 0 0 33.33%;
  padding: 0 8px;
  box-sizing: border-box;
  margin: 12px 0 0;
}

.monitor-chart-container{
  width: 100%;
  height: 256px;
  border-radius: 2px;
  border: 1px solid #DFE1ED;
}
</style>
