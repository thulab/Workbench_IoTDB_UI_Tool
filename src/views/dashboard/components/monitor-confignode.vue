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

<style lang="scss" scoped>
.monitor-chart-wrapper{
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.monitor-chart-box-4{
  width: calc((100% - 48px) / 4);
  margin: 12px 16px 0 0;
  height: 258px;
  border-radius: 2px;
  border: 1px solid #DFE1ED;
  box-sizing: border-box;

  &:nth-of-type(4n) {
    margin-right: 0;
  }
}

.monitor-chart-box-3{
  width: calc((100% - 32px) / 3);
  margin: 12px 16px 0 0;
  height: 258px;
  border-radius: 2px;
  border: 1px solid #DFE1ED;
  box-sizing: border-box;

  &:nth-of-type(3n) {
    margin-right: 0;
  }
}

.monitor-chart-box-2{
  width: calc((100% - 16px) / 2);
  margin: 12px 16px 0 0;
  height: 258px;
  border-radius: 2px;
  border: 1px solid #DFE1ED;
  box-sizing: border-box;

  &:nth-of-type(2n) {
    margin-right: 0;
  }
}

.monitor-chart-container{
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.monitor-info-module-title{
  font-size: 18px;
  font-weight: 400;
  line-height: 27px;
  color: #131926;
  text-align: center;
  margin: 14px 0 4px;
}

.monitor-module-title-box{
  display: flex;

  .monitor-info-title{
    flex: 1;
    text-align: center;
    font-size: 12px;
    font-weight: 300;
    line-height: 18px;
    color: #424561;
  }
}

.monitor-info-list{
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.monitor-info-module-box{
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  .monitor-info-module-text{
    font-size: 72px;
    font-weight: 700;
    line-height: 105px;
    color: #495AD4;
  }

  .monitor-info-module-unit{
    font-size: 24px;
    padding-left: 4px;
  }
}

.chart-container-box{
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
