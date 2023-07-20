<template>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box-3">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 核数</h4>
        <div class="monitor-module-title-box">
          <h6 class="monitor-info-title">DataNode</h6>
          <h6 class="monitor-info-title">ConfigNode</h6>
        </div>
        <div class="monitor-info-list">
          <p class="monitor-info-module-text">48</p>
          <p class="monitor-info-module-text" style="color: #009DEA;">6</p>
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-3">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">磁盘空间</h4>
        <div class="monitor-module-title-box">
          <h6 class="monitor-info-title">DataNode</h6>
          <h6 class="monitor-info-title">ConfigNode</h6>
        </div>
        <div class="chart-container-box">
          <the-chart :option="diskMemoryChartOptions" />
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-3">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">系统内存</h4>
        <div class="monitor-module-title-box">
          <h6 class="monitor-info-title">DataNode</h6>
          <h6 class="monitor-info-title">ConfigNode</h6>
        </div>
        <div class="chart-container-box">
          <the-chart :option="systemMemoryChartOptions" />
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-3">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">磁盘 I/O 繁忙速率</h4>
        <div class="chart-container-box">
          <the-chart :option="diskIOChartOptions" />
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-3">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">每秒写入点数</h4>
        <p class="monitor-info-module-text">100000</p>
      </div>
    </div>
    <div class="monitor-chart-box-3">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">文件总数</h4>
        <p class="monitor-info-module-text">6243892</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ECOption } from '@/plugins/echarts-plugin';

const diskIOChartOptions = computed<ECOption>(() => ({
  tooltip: {
    show: false,
  },
  legend: {
    show: true,
  },
  grid: {
    left: 20,
    right: 40,
    bottom: 20,
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    boundaryGap: false,
  },
  yAxis: {
    type: 'category',
    data: ['vda', 'vdb', 'vdc'],
  },
  series: [
    {
      name: 'DataNode',
      type: 'bar',
      data: [18203, 23489, 29034],
      itemStyle: {
        color: '#495AD4',
      },
      label: {
        show: true,
        position: 'right',
        formatter: '{c}%',
      },
    },
    {
      name: 'ConfigNode',
      type: 'bar',
      data: [19325, 23438, 31000],
      itemStyle: {
        color: '#009DEA',
      },
      label: {
        show: true,
        position: 'right',
        formatter: '{c}%',
      },
    },
  ],
}));

const diskMemoryChartOptions = computed<ECOption>(() => ({
  tooltip: {
    show: false,
  },
  series: [
    {
      type: 'pie',
      radius: ['55%', '70%'],
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      top: 0,
      bottom: 0,
      left: 0,
      right: '50%',
      data: [
        {
          value: 100,
          name: 'Search Engine',
          itemStyle: {
            color: '#DFE1ED',
          },
        },
      ],
    },
    {
      type: 'pie',
      radius: ['50%', '75%'],
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      clockwise: false,
      top: 0,
      bottom: 0,
      left: 0,
      right: '50%',
      data: [
        {
          value: 33,
          name: 'Baidu',
          itemStyle: {
            color: '#495AD4',
          },
        },
        {
          value: 100,
          name: 'Direct',
          itemStyle: {
            opacity: 0,
          },
        },
      ],
    },
    {
      type: 'pie',
      radius: ['55%', '70%'],
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      top: 0,
      bottom: 0,
      left: '50%',
      right: 0,
      data: [
        {
          value: 100,
          name: 'Search Engine',
          itemStyle: {
            color: '#DFE1ED',
          },
        },
      ],
    },
    {
      type: 'pie',
      radius: ['50%', '75%'],
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      clockwise: true,
      top: 0,
      bottom: 0,
      left: '50%',
      right: 0,
      data: [
        {
          value: 33,
          name: 'Baidu',
          itemStyle: {
            color: '#009DEA',
          },
        },
        {
          value: 100,
          name: 'Direct',
          itemStyle: {
            opacity: 0,
          },
        },
      ],
    },
  ],
}));

const systemMemoryChartOptions = computed<ECOption>(() => ({
  tooltip: {
    show: false,
  },
  series: [
    {
      type: 'pie',
      radius: ['55%', '70%'],
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      top: 0,
      bottom: 0,
      left: 0,
      right: '50%',
      data: [
        {
          value: 100,
          name: 'Search Engine',
          itemStyle: {
            color: '#DFE1ED',
          },
        },
      ],
    },
    {
      type: 'pie',
      radius: ['50%', '75%'],
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      clockwise: false,
      top: 0,
      bottom: 0,
      left: 0,
      right: '50%',
      data: [
        {
          value: 33,
          name: 'Baidu',
          itemStyle: {
            color: '#495AD4',
          },
        },
        {
          value: 100,
          name: 'Direct',
          itemStyle: {
            opacity: 0,
          },
        },
      ],
    },
    {
      type: 'pie',
      radius: ['55%', '70%'],
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      top: 0,
      bottom: 0,
      left: '50%',
      right: 0,
      data: [
        {
          value: 100,
          name: 'Search Engine',
          itemStyle: {
            color: '#DFE1ED',
          },
        },
      ],
    },
    {
      type: 'pie',
      radius: ['50%', '75%'],
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      clockwise: true,
      top: 0,
      bottom: 0,
      left: '50%',
      right: 0,
      data: [
        {
          value: 33,
          name: 'Baidu',
          itemStyle: {
            color: '#009DEA',
          },
        },
        {
          value: 100,
          name: 'Direct',
          itemStyle: {
            opacity: 0,
          },
        },
      ],
    },
  ],
}));

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
  font-size: 80px;
  font-weight: 700;
  line-height: 145px;
  color: #495AD4;
}

.chart-container-box{
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
