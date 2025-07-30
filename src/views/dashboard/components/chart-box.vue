<template>
  <div class="chart-box">
    <div class="chart-title">{{ data.title }}</div>
    <div class="chart-container">
      <div class="chart" ref="chartDom"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts';
import type { ECOption } from '@/plugins/echarts-plugin';

const props = defineProps<{
  data: {
    type: object;
    title: string;
    options: ECOption;
  };
}>();

const chartDom = ref();
let Chart: echarts.ECharts;
onMounted(() => {
  Chart = echarts.init(chartDom.value);
  const option: ECOption = {
    tooltip: {
      trigger: 'axis',
      confine: true,
      textStyle: {
        align: 'left',
      },
    },
    grid: {
      top: '20px',
      left: '20px',
      right: '20px',
      bottom: '44px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { show: true, lineStyle: { color: ' #eee', width: 1 } },
      axisLabel: { show: true, color: '#8E97AA' },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: true, lineStyle: { color: ' #eee', width: 1 } },
      axisLabel: { show: true, color: '#8E97AA' },
      splitLine: { show: false },
    },
  };
  Object.assign(option, props.data.options);
  if (option) {
    Chart.setOption(option);
  }
});
watch(
  () => props.data,
  (newValue) => {
    if (newValue) {
      Chart.setOption(newValue.options);
    }
  },
  {
    deep: true,
  },
);
</script>

<style lang="scss" scoped>
.chart-box {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-container {
  flex: 1;
}

.chart {
  height: 100%;
}

.chart-title {
  padding: 20px 0 0 20px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 22px;
  text-align: left;
}
</style>
