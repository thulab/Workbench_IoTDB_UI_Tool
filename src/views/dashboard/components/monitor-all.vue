<template>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box-3" v-loading="cpuLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 核数</h4>
        <div class="monitor-module-title-box">
          <h6 class="monitor-info-title">DataNode</h6>
          <h6 class="monitor-info-title">ConfigNode</h6>
        </div>
        <div class="monitor-info-list">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">48</p>
          </div>
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text" style="color: #009DEA;">6</p>
          </div>
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
          <the-chart :option="diskDataOptions" />
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
          <the-chart :option="systemDataOptions" />
        </div>
      </div>
    </div>
  </div>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box-2">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">每秒写入点数</h4>
        <data-container :is-empty="false">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">{{toThousands(100000)}}</p>
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-2">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">文件总数</h4>
        <data-container :is-empty="false">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">{{toThousands(6243892)}}</p>
          </div>
        </data-container>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ECOption } from '@/plugins/echarts-plugin';
import { toThousands } from '@/utils/format';
import { DashboardApi } from '@/api';
import DataContainer from './data-container.vue';

interface PieChartData {
  themeColor: string;
  valueUnit: string;
  dataVal: string;
  totalVal: string;
}

const cpuData = reactive<{
  dataCpu: number | null,
  configCpu: number | null,
}>({
  dataCpu: null,
  configCpu: null,
});

const dataNodeMemoryData = reactive<PieChartData>({
  themeColor: '#495AD4',
  valueUnit: 'TiB',
  dataVal: '2',
  totalVal: '8',
});

const configNodeMemoryData = reactive<PieChartData>({
  themeColor: '#009DEA',
  valueUnit: 'TiB',
  dataVal: '0.5',
  totalVal: '2',
});

const dataNodeSystemData = reactive<PieChartData>({
  themeColor: '#495AD4',
  valueUnit: 'GiB',
  dataVal: '30234',
  totalVal: '10045345',
});

const configNodeSystemData = reactive<PieChartData>({
  themeColor: '#009DEA',
  valueUnit: 'GiB',
  dataVal: '12.5',
  totalVal: '50',
});

const memoryChartOptions = (dataNode: PieChartData, configNode: PieChartData): ECOption => ({
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
          value: dataNode.totalVal,
          name: '磁盘空间',
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
          value: dataNode.dataVal,
          name: 'DataNode',
          itemStyle: {
            color: dataNode.themeColor,
          },
        },
        {
          value: Number(dataNode.totalVal) - Number(dataNode.dataVal),
          name: '磁盘空间',
          itemStyle: {
            opacity: 0,
          },
        },
      ],
    },
    {
      type: 'gauge',
      z: 3,
      pointer: {
        show: false,
      },
      progress: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      radius: '100%',
      center: ['25%', '50%'],
      data: [{
        value: 0,
        title: {
          show: false,
        },
        detail: {
          offsetCenter: ['0', '8'],
          formatter: `{dataValue|${dataNode.dataVal}}{dataUnit|${dataNode.valueUnit}}\n{line|}\n{totalValue|${dataNode.totalVal}}{totalUnit|${dataNode.valueUnit}}`,
          rich: {
            dataValue: {
              fontSize: 30,
              fontWeight: 700,
              height: 30,
              color: dataNode.themeColor,
              textBorderWidth: 1,
              textBorderColor: '#fff',
              textBorderType: 'solid',
            },
            dataUnit: {
              fontSize: 12,
              fontWeight: 700,
              height: 18,
              padding: [0, 0, 0, 2],
              color: dataNode.themeColor,
              verticalAlign: 'bottom',
              textBorderWidth: 1,
              textBorderColor: '#fff',
              textBorderType: 'solid',

            },
            line: {
              width: 60,
              lineHeight: 4,
              height: 0,
              borderWidth: 0.5,
              borderColor: '#DFE1ED',
              verticalAlign: 'bottom',
            },
            totalValue: {
              fontSize: 12,
              fontWeight: 700,
              height: 18,
              verticalAlign: 'top',
              color: '#424561',
              textBorderWidth: 1,
              textBorderColor: '#fff',
              textBorderType: 'solid',
            },
            totalUnit: {
              fontSize: 12,
              fontWeight: 300,
              height: 18,
              padding: [0, 0, 0, 2],
              verticalAlign: 'top',
              color: '#424561',
              textBorderWidth: 1,
              textBorderColor: '#fff',
              textBorderType: 'solid',
            },
          },
        },
      }],
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
          value: configNode.totalVal,
          name: '磁盘空间',
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
          value: configNode.dataVal,
          name: 'ConfigNode',
          itemStyle: {
            color: configNode.themeColor,
          },
        },
        {
          value: Number(configNode.totalVal) - Number(configNode.dataVal),
          name: '磁盘空间',
          itemStyle: {
            opacity: 0,
          },
        },
      ],
    },
    {
      type: 'gauge',
      z: 3,
      pointer: {
        show: false,
      },
      progress: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      radius: '100%',
      center: ['75%', '50%'],
      data: [{
        value: 0,
        title: {
          show: false,
        },
        detail: {
          offsetCenter: ['0', '8'],
          formatter: `{dataValue|${configNode.dataVal}}{dataUnit|${configNode.valueUnit}}\n{line|}\n{totalValue|${configNode.totalVal}}{totalUnit|${configNode.valueUnit}}`,
          rich: {
            dataValue: {
              fontSize: 30,
              fontWeight: 700,
              height: 30,
              color: configNode.themeColor,
              textBorderWidth: 1,
              textBorderColor: '#fff',
              textBorderType: 'solid',
            },
            dataUnit: {
              fontSize: 12,
              fontWeight: 700,
              height: 18,
              padding: [0, 0, 0, 2],
              color: configNode.themeColor,
              verticalAlign: 'bottom',
              textBorderWidth: 1,
              textBorderColor: '#fff',
              textBorderType: 'solid',

            },
            line: {
              width: 60,
              lineHeight: 4,
              height: 0,
              borderWidth: 0.5,
              borderColor: '#DFE1ED',
              verticalAlign: 'bottom',
            },
            totalValue: {
              fontSize: 12,
              fontWeight: 700,
              height: 18,
              verticalAlign: 'top',
              color: '#424561',
              textBorderWidth: 1,
              textBorderColor: '#fff',
              textBorderType: 'solid',
            },
            totalUnit: {
              fontSize: 12,
              fontWeight: 300,
              height: 18,
              padding: [0, 0, 0, 2],
              verticalAlign: 'top',
              color: '#424561',
              textBorderWidth: 1,
              textBorderColor: '#fff',
              textBorderType: 'solid',
            },
          },
        },
      }],
    },
  ],
} as ECOption);

const diskDataOptions = computed(() => memoryChartOptions(dataNodeMemoryData, configNodeMemoryData));
const systemDataOptions = computed(() => memoryChartOptions(dataNodeSystemData, configNodeSystemData));

const { requestFn: getMetricAllCPU, loading: cpuLoading } = useRequest(DashboardApi.getMetricAllCPU);

function getCpu() {
  getMetricAllCPU().then((res) => {
    if (res.data) {
      //
    }
  });
}

function getInitial() {
  getCpu();
}

onMounted(() => {
  getInitial();
});

defineExpose({ getInitial });
</script>
