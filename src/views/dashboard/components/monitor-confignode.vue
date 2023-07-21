<template>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box-4">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 核数</h4>
        <data-container :is-empty="false">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">48</p>
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-4">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 负载</h4>
        <div class="chart-container-box">
          <the-chart :option="cpuDataOptions" />
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-4">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">系统内存</h4>
        <data-container :is-empty="false">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">31.3<span class="monitor-info-module-unit">GiB</span></p>
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-4">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">内存使用情况</h4>
        <div class="chart-container-box">
          <the-chart :option="momoryDataOptions" />
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-4">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">磁盘 I/O 繁忙速率</h4>
        <div class="chart-container-box">
          <the-chart :option="diskIODataOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ECOption } from '@/plugins/echarts-plugin';
import DataContainer from './data-container.vue';

interface GaugeChartData {
  themeColor: string;
  opacityColor: string;
  dataVal: string;
}

const cpuData = reactive<GaugeChartData>({
  themeColor: '#495AD4',
  opacityColor: '#929CE5',
  dataVal: '19.15',
});

const momoryData = reactive<GaugeChartData>({
  themeColor: '#6738BD',
  opacityColor: '#A488D7',
  dataVal: '22.23',
});

const diskIOCategory = ref<string[]>(['vda', 'vdb', 'vdc']);
const diskIOData = ref<string[]>(['12', '25', '98']);

const gaugeChartOptions = (optionData: GaugeChartData) => ({
  series: [
    {
      type: 'gauge',
      center: ['50%', '60%'],
      startAngle: 200,
      endAngle: -20,
      itemStyle: {
        color: optionData.themeColor,
      },
      progress: {
        show: true,
        width: 16,
      },
      pointer: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          width: 16,
        },
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      anchor: {
        show: false,
      },
      title: {
        show: false,
      },
      detail: {
        offsetCenter: [0, '-8%'],
        fontSize: 18,
        fontWeight: 'bolder',
        formatter: '{value} %',
        color: 'inherit',
      },
      data: [
        {
          value: optionData.dataVal,
        },
      ],
    },
    {
      type: 'gauge',
      center: ['50%', '60%'],
      startAngle: 200,
      endAngle: -20,
      itemStyle: {
        color: optionData.opacityColor,
      },
      progress: {
        show: true,
        width: 4,
      },
      pointer: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      detail: {
        show: false,
      },
      data: [
        {
          value: optionData.dataVal,
        },
      ],
    },
  ],
} as ECOption);

const diskIOChartOptions = (categoryList: string[], valueList: string[]) => ({
  tooltip: {
    show: false,
  },
  legend: {
    show: false,
  },
  grid: {
    left: 20,
    right: 40,
    bottom: 20,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: categoryList,
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      type: 'bar',
      data: valueList,
      itemStyle: {
        color: '#495AD4',
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}%',
      },
    },
  ],
} as ECOption);

const cpuDataOptions = computed(() => gaugeChartOptions(cpuData));
const momoryDataOptions = computed(() => gaugeChartOptions(momoryData));
const diskIODataOptions = computed(() => diskIOChartOptions(diskIOCategory.value, diskIOData.value));

</script>
