<template>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box-4">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 核数</h4>
        <p class="monitor-info-module-text">48</p>
      </div>
    </div>
    <div class="monitor-chart-box-4">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">磁盘空间</h4>
        <p class="monitor-info-module-text">48<span class="monitor-info-module-unit">TiB</span></p>
      </div>
    </div>
    <div class="monitor-chart-box-4">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">系统内存</h4>
        <p class="monitor-info-module-text">31.3<span class="monitor-info-module-unit">GiB</span></p>
      </div>
    </div>
    <div class="monitor-chart-box-4">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">文件总数</h4>
        <p class="monitor-info-module-text">{{toThousands(62432)}}</p>
      </div>
    </div>
  </div>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box-3">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 负载</h4>
        <div class="chart-container-box">
          <the-chart :option="gaugeChartOptions('#495AD4', '#929CE5', '19.15')" />
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-3">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">磁盘使用情况</h4>
        <div class="chart-container-box">
          <the-chart :option="gaugeChartOptions('#009DEA', '#66C4F2', '33.9')" />
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-3">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">内存使用情况</h4>
        <div class="chart-container-box">
          <the-chart :option="gaugeChartOptions('#6738BD', '#A488D7', '22.23')" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ECOption } from '@/plugins/echarts-plugin';
import { toThousands } from '@/utils/format';

const gaugeChartOptions = computed(() => function (color1: string, color2: string, value: string) {
  return ({
    series: [
      {
        type: 'gauge',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -20,
        itemStyle: {
          color: color1,
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
            value,
          },
        ],
      },
      {
        type: 'gauge',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -20,
        itemStyle: {
          color: color2,
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
            value,
          },
        ],
      },
    ],
  }) as ECOption;
});

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
  height: 242px;
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
  height: 242px;
  border-radius: 2px;
  border: 1px solid #DFE1ED;
  box-sizing: border-box;

  &:nth-of-type(3n) {
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

.monitor-info-module-text{
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  font-weight: 700;
  line-height: 96px;
  color: #495AD4;

  .monitor-info-module-unit{
    font-size: 16px;
    align-self: end;
    transform: translateY(-30%);
  }
}

.chart-container-box{
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
