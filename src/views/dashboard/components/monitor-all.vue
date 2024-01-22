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
            <p class="monitor-info-module-text">{{ cpuData.dataCpu }}</p>
          </div>
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text" style="color: #009DEA;">{{ cpuData.configCpu }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-3" v-loading="diskLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">磁盘空间</h4>
        <div class="monitor-module-legend-box">
          <p class="monitor-info-legend" style="margin-right: 32px;">
            <i class="legeng-icon" style="background-color: #495AD4;"></i>已用空间
          </p>
          <p class="monitor-info-legend">
            <i class="legeng-icon" style="background-color: #DFE1ED;"></i>剩余空间
          </p>
        </div>
        <data-container :is-empty="diskMemoryData.diskTotal === null">
          <div class="chart-container-box">
            <the-chart :option="diskMemoryOptions" key="diskChart" />
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-3" v-loading="systemLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">系统内存</h4>
        <div class="monitor-module-title-box">
          <h6 class="monitor-info-title">DataNode</h6>
          <h6 class="monitor-info-title">ConfigNode</h6>
        </div>
        <div class="chart-container-box">
          <the-chart :option="systemDataOptions" key="memoryChart" />
        </div>
      </div>
    </div>
  </div>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box-2" v-loading="speedLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">每秒写入点数</h4>
        <data-container :is-empty="writeSpeed === null">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">{{toThousands(writeSpeed)}}</p>
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-2" v-loading="fileLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">文件总数</h4>
        <data-container :is-empty="fileTotal === null">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">{{toThousands(fileTotal)}}</p>
          </div>
        </data-container>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type ECOption } from '@/plugins/echarts-plugin';
import { toThousands, transformDecimal } from '@/utils/format';
import { DashboardApi } from '@/api';
import DataContainer from './data-container.vue';

const props = defineProps<{
  clusterType: 'master' | 'slave';
}>();

const emit = defineEmits<{
  (event: 'handleFetch',): void;
}>();

interface PieChartData {
  themeColor: string;
  valueUnit: string;
  dataVal: number;
  totalVal: number;
  percent: number;
}

const cpuData = reactive<{
  dataCpu: number | string,
  configCpu: number | string,
}>({
  dataCpu: '',
  configCpu: '',
});

const dataNodeMemoryData = reactive<PieChartData>({
  themeColor: '#495AD4',
  valueUnit: 'TiB',
  dataVal: 0,
  totalVal: 0,
  percent: 0,
});

const configNodeMemoryData = reactive<PieChartData>({
  themeColor: '#009DEA',
  valueUnit: 'TiB',
  dataVal: 0,
  totalVal: 0,
  percent: 0,
});

const dataNodeSystemData = reactive<PieChartData>({
  themeColor: '#495AD4',
  valueUnit: 'GiB',
  dataVal: 0,
  totalVal: 0,
  percent: 0,
});

const configNodeSystemData = reactive<PieChartData>({
  themeColor: '#009DEA',
  valueUnit: 'GiB',
  dataVal: 0,
  totalVal: 0,
  percent: 0,
});

const diskMemoryData = reactive<Dashboard.MetricDiskRes>({
  diskTotal: null,
  totalUnit: '',
  diskUse: 0,
  useUnit: '',
  diskUseRatio: 0,
  ioTDBUse: 0,
  ioTDBUnit: '',
  ioTDBUseRatio: 0,
  diskRemain: 0,
  diskRemainUnit: '',
});

const writeSpeed = ref();
const fileTotal = ref();

const memoryChartOptions = (dataNode: PieChartData, configNode: PieChartData, totalNumUnit: string): ECOption => ({
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
          value: 0,
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
          value: dataNode.percent,
          name: 'DataNode',
          itemStyle: {
            color: dataNode.themeColor,
          },
        },
        {
          value: 1 - Number(dataNode.percent),
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
          show: !!dataNode.totalVal,
          offsetCenter: ['0', '10'],
          formatter: `{dataValue|${dataNode.dataVal}}{dataUnit|${dataNode.valueUnit}}\n{line|}\n{totalValue|${dataNode.totalVal}}{totalUnit|${totalNumUnit}}`,
          rich: {
            dataValue: {
              fontSize: 30,
              fontWeight: 700,
              height: 30,
              padding: [0, 0, 0, 0],
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
              lineHeight: 8,
              height: 0,
              borderWidth: 1,
              borderColor: '#DFE1ED',
              verticalAlign: 'bottom',
            },
            totalValue: {
              fontSize: 12,
              fontWeight: 700,
              height: 18,
              padding: [2, 0, 0, 0],
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
              padding: [2, 0, 0, 2],
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
          value: 0,
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
          value: configNode.percent,
          name: 'ConfigNode',
          itemStyle: {
            color: configNode.themeColor,
          },
        },
        {
          value: 1 - Number(configNode.percent),
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
          show: !!configNode.totalVal,
          offsetCenter: ['0', '8'],
          formatter: `{dataValue|${configNode.dataVal}}{dataUnit|${configNode.valueUnit}}\n{line|}\n{totalValue|${configNode.totalVal}}{totalUnit|${totalNumUnit}}`,
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

const diskChartOptions = (diskMemoryChartData: Dashboard.MetricDiskRes): ECOption => ({
  tooltip: {
    trigger: 'axis',
    show: true,
    axisPointer: {
      type: 'shadow',
    },
    confine: true,
    formatter: (params) => {
      let res = '';
      const paramsData = params as unknown as Array<Record<string, any>>;
      const circle = '<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:';
      paramsData.forEach((item) => {
        // eslint-disable-next-line no-nested-ternary
        res += `<div style="margin: 10px 0 0;">${circle}${item.color}"></span><span style="font-size:14px;color:#666;font-weight:400;margin-left:2px">${item.seriesName}</span><span style="float:right;margin-left:20px;font-size:14px;color:#666;font-weight:900">${item.axisValueLabel === '磁盘空间' ? (item.seriesName === '已用空间'
          ? `${diskMemoryChartData.diskUse} ${diskMemoryChartData.useUnit}` : `${diskMemoryChartData.diskRemain} ${diskMemoryChartData.diskRemainUnit}`) : (item.seriesName === '已用空间' ? `${diskMemoryChartData.ioTDBUse} ${diskMemoryChartData.ioTDBUnit}` : '-')}</span></div>`;
      });
      return `<div style="font-size:14px;color:#666;font-weight:400;line-height:1;">${paramsData[0].axisValueLabel}</div>${res}`;
    },
  },
  grid: {
    left: 10,
    right: 40,
    top: 20,
    bottom: 20,
    containLabel: true,
  },
  barWidth: 30,
  yAxis: {
    type: 'category',
    data: ['IoTDB 空间', '磁盘空间'],
    axisTick: {
      show: false,
    },
    axisLine: {
      lineStyle: {
        color: '#DFE1ED',
      },
    },
    axisLabel: {
      color: '#424561',
      fontWeight: 300,
    },
  },
  xAxis: {
    type: 'value',
    max: diskMemoryChartData.diskTotal,
    axisLabel: {
      showMaxLabel: true,
      color: '#424561',
      fontWeight: 300,
      formatter(value, index) {
        if (index === 0 || value === diskMemoryChartData.diskTotal) {
          return value + diskMemoryChartData.totalUnit;
        }
        return value;
      },
    },
    splitLine: {
      lineStyle: {
        color: '#DFE1ED',
      },
    },
  },
  series: [
    {
      name: '已用空间',
      type: 'bar',
      stack: 'total',
      data: [
        (diskMemoryChartData.ioTDBUse === 0 || diskMemoryChartData.ioTDBUseRatio === 0) ? 0.1 : transformDecimal(diskMemoryChartData.diskTotal! * diskMemoryChartData.ioTDBUseRatio, 3),
        transformDecimal(diskMemoryChartData.diskTotal! * diskMemoryChartData.diskUseRatio, 3),
      ],
      itemStyle: {
        color: '#495AD4',
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => {
          if (params.name === 'IoTDB 空间') {
            return `${diskMemoryChartData.ioTDBUse} ${diskMemoryChartData.ioTDBUnit}`;
          }
          return `${diskMemoryChartData.diskUse} ${diskMemoryChartData.useUnit}`;
        },
        fontSize: 12,
        fontWeight: 700,
        color: '#495AD4',
      },
      emphasis: {
        focus: 'none',
      },
    },
    {
      name: '剩余空间',
      type: 'bar',
      stack: 'total',
      // eslint-disable-next-line no-sparse-arrays
      data: [
        ,
        transformDecimal(diskMemoryChartData.diskTotal! - transformDecimal(diskMemoryChartData.diskTotal! * diskMemoryChartData.diskUseRatio, 3), 3),
      ],
      itemStyle: {
        color: '#DFE1ED',
      },
      label: {
        show: true,
        position: 'top',
        formatter: (params: any) => {
          if (params.name === '磁盘空间') {
            return `${diskMemoryChartData.diskRemain} ${diskMemoryChartData.diskRemainUnit}`;
          }
          return '';
        },
        fontSize: 12,
        fontWeight: 700,
        color: '#495AD4',
      },
      emphasis: {
        focus: 'none',
      },
    },
  ],
} as ECOption);

const diskMemoryOptions = computed(() => diskChartOptions(diskMemoryData));
const systemDataOptions = computed(() => memoryChartOptions(dataNodeSystemData, configNodeSystemData, 'GiB'));

const isMaster = computed(() => props.clusterType === 'master');

const { requestFn: getMetricAllCPU, loading: cpuLoading } = useRequest(DashboardApi.getMetricAllCPU);
const { requestFn: getMetricAllDisk, loading: diskLoading } = useRequest(DashboardApi.getMetricAllDisk);
const { requestFn: getMetricAllMemory, loading: systemLoading } = useRequest(DashboardApi.getMetricAllMemory);
const { requestFn: getMetricInsertNumPerSecond, loading: speedLoading } = useRequest(DashboardApi.getMetricInsertNumPerSecond);
const { requestFn: getMetricAllFileCount, loading: fileLoading } = useRequest(DashboardApi.getMetricAllFileCount);

function getCpu() {
  return getMetricAllCPU(isMaster.value).then((res) => {
    if (res.data) {
      res.data.forEach((item) => {
        if (item.nodeType === 'DataNode') {
          cpuData.dataCpu = (item.cpu || item.cpu === 0) ? item.cpu : '-';
        } else if (item.nodeType === 'ConfigNode') {
          cpuData.configCpu = (item.cpu || item.cpu === 0) ? item.cpu : '-';
        }
      });
    } else {
      cpuData.dataCpu = '-';
      cpuData.configCpu = '-';
    }
  }).catch(() => {
    cpuData.dataCpu = '';
    cpuData.configCpu = '';
  });
}

function getDisk() {
  return getMetricAllDisk(isMaster.value).then((res) => {
    diskMemoryData.diskTotal = res.data.diskTotal || null;
    diskMemoryData.totalUnit = res.data.totalUnit || '';
    diskMemoryData.diskUse = res.data.diskUse || 0;
    diskMemoryData.useUnit = res.data.useUnit || '';
    diskMemoryData.diskUseRatio = res.data.diskUseRatio || 0;
    diskMemoryData.ioTDBUse = res.data.ioTDBUse || 0;
    diskMemoryData.ioTDBUnit = res.data.ioTDBUnit || '';
    diskMemoryData.ioTDBUseRatio = res.data.ioTDBUseRatio || 0;
    diskMemoryData.diskRemain = res.data.diskRemain || 0;
    diskMemoryData.diskRemainUnit = res.data.diskRemainUnit || '';
  }).catch(() => {
    diskMemoryData.diskTotal = null;
    diskMemoryData.totalUnit = '';
    diskMemoryData.diskUse = 0;
    diskMemoryData.useUnit = '';
    diskMemoryData.diskUseRatio = 0;
    diskMemoryData.ioTDBUse = 0;
    diskMemoryData.ioTDBUnit = '';
    diskMemoryData.ioTDBUseRatio = 0;
    diskMemoryData.diskRemain = 0;
    diskMemoryData.diskRemainUnit = '';
  });
}

function getSystem() {
  return getMetricAllMemory(isMaster.value).then((res) => {
    if (res.data) {
      res.data.forEach((item) => {
        if (item.nodeType === 'DataNode') {
          dataNodeSystemData.dataVal = item.memoryUse;
          dataNodeSystemData.totalVal = item.memoryTotal;
          dataNodeSystemData.percent = item.memoryRatio;
          dataNodeSystemData.valueUnit = item.unit;
        } else if (item.nodeType === 'ConfigNode') {
          configNodeSystemData.dataVal = item.memoryUse;
          configNodeSystemData.totalVal = item.memoryTotal;
          configNodeSystemData.percent = item.memoryRatio;
          configNodeSystemData.valueUnit = item.unit;
        }
      });
    }
  }).catch(() => {
    dataNodeSystemData.dataVal = 0;
    dataNodeSystemData.totalVal = 0;
    dataNodeSystemData.percent = 0;
    configNodeSystemData.dataVal = 0;
    configNodeSystemData.totalVal = 0;
    configNodeSystemData.percent = 0;
  });
}

function getSpeed() {
  return getMetricInsertNumPerSecond(isMaster.value).then((res) => {
    writeSpeed.value = res.data;
  }).catch(() => {
    writeSpeed.value = null;
  });
}

function getFile() {
  return getMetricAllFileCount(isMaster.value).then((res) => {
    fileTotal.value = res.data;
  }).catch(() => {
    fileTotal.value = null;
  });
}

function initialAssign() {
  cpuData.dataCpu = '';
  cpuData.configCpu = '';
  dataNodeMemoryData.dataVal = 0;
  dataNodeMemoryData.totalVal = 0;
  dataNodeMemoryData.percent = 0;
  configNodeMemoryData.dataVal = 0;
  configNodeMemoryData.totalVal = 0;
  configNodeMemoryData.percent = 0;
  dataNodeSystemData.dataVal = 0;
  dataNodeSystemData.totalVal = 0;
  dataNodeSystemData.percent = 0;
  configNodeSystemData.dataVal = 0;
  configNodeSystemData.totalVal = 0;
  configNodeSystemData.percent = 0;
  diskMemoryData.diskTotal = null;
  diskMemoryData.totalUnit = '';
  diskMemoryData.diskUse = 0;
  diskMemoryData.useUnit = '';
  diskMemoryData.diskUseRatio = 0;
  diskMemoryData.ioTDBUse = 0;
  diskMemoryData.ioTDBUnit = '';
  diskMemoryData.ioTDBUseRatio = 0;
  diskMemoryData.diskRemain = 0;
  diskMemoryData.diskRemainUnit = '';
  writeSpeed.value = null;
  fileTotal.value = null;
}

function getInitial() {
  Promise.allSettled([
    getCpu(),
    getDisk(),
    getSystem(),
    getSpeed(),
    getFile(),
  ]).then(() => {
    emit('handleFetch');
  });
}

defineExpose({ getInitial, initialAssign });
</script>
