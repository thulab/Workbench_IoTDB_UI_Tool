<template>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box-media" v-loading="cpuLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 核数</h4>
        <data-container :is-empty="cpuCount === null">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">{{ cpuCount }}</p>
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-media" v-loading="diskLoading">
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
    <div class="monitor-chart-box-media" v-loading="memoryLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">系统内存</h4>
        <data-container :is-empty="memoryData.dataCount === null">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">{{ memoryData.dataCount }}<span class="monitor-info-module-unit">{{ memoryData.valueUnit }}</span></p>
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-media" v-loading="fileLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">文件总数</h4>
        <data-container :is-empty="fileTotal === null">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">{{toThousands(fileTotal)}}</p>
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-media" v-loading="cpuLoadLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 负载</h4>
        <data-container :is-empty="cpuData.dataVal === null">
          <div class="chart-container-box">
            <the-chart :option="cpuDataOptions" key="cpuData" />
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-media" v-loading="diskLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">磁盘使用情况</h4>
        <data-container :is-empty="diskMemoryData.diskTotal === null">
          <div class="chart-container-box">
            <the-chart :option="diskDataOptions" key="diskData" />
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-media" v-loading="memoryLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">内存使用情况</h4>
        <data-container :is-empty="memoryData.dataCount === null">
          <div class="chart-container-box">
            <the-chart :option="memoryDataOptions" key="memoryData" />
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-media" v-loading="ioLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">磁盘 I/O 繁忙速率</h4>
        <data-container :is-empty="diskIOCategory.length === 0">
          <div class="chart-container-box">
            <the-chart :option="diskIODataOptions" key="diskIOData" />
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
  node: string;
  nodeType: string;
  clusterType: 'master' | 'slave';
}>();

const emit = defineEmits<{
  (event: 'handleFetch',): void;
}>();

interface GaugeChartData {
  themeColor: string;
  opacityColor: string;
  dataVal: number | null;
  dataCount: number | null;
  valueUnit?: string;
}

const cpuCount = ref();
const cpuData = reactive<GaugeChartData>({
  themeColor: '#495AD4',
  opacityColor: '#929CE5',
  dataVal: null,
  dataCount: null,
});

const diskData = reactive<GaugeChartData>({
  themeColor: '#495AD4',
  opacityColor: '#929CE5',
  dataVal: 0,
  dataCount: null,
  valueUnit: 'TiB',
});

const memoryData = reactive<GaugeChartData>({
  themeColor: '#6738BD',
  opacityColor: '#A488D7',
  dataVal: 0,
  dataCount: null,
  valueUnit: 'GiB',
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

const fileTotal = ref();
const diskIOCategory = ref<string[]>([]);
const diskIOData = ref<number[]>([]);

const isMaster = computed(() => props.clusterType === 'master');

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

const diskIOChartOptions = (categoryList: string[], valueList: number[]) => ({
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
    show: categoryList.length > 0,
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
        transformDecimal(diskMemoryChartData.diskTotal! * diskMemoryChartData.ioTDBUseRatio, 3),
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
const cpuDataOptions = computed(() => gaugeChartOptions(cpuData));
const diskDataOptions = computed(() => gaugeChartOptions(diskData));
const memoryDataOptions = computed(() => gaugeChartOptions(memoryData));
const diskIODataOptions = computed(() => diskIOChartOptions(diskIOCategory.value, diskIOData.value));

const { requestFn: getMetricCPU, loading: cpuLoading } = useRequest(DashboardApi.getMetricCPU);
const { requestFn: getMetricDisk, loading: diskLoading } = useRequest(DashboardApi.getMetricDisk);
const { requestFn: getMetricCPULoad, loading: cpuLoadLoading } = useRequest(DashboardApi.getMetricCPULoad);
const { requestFn: getMetricMemory, loading: memoryLoading } = useRequest(DashboardApi.getMetricMemory);
const { requestFn: getMetricFileCount, loading: fileLoading } = useRequest(DashboardApi.getMetricFileCount);
const { requestFn: getMetricDiskIOUsedRate, loading: ioLoading } = useRequest(DashboardApi.getMetricDiskIOUsedRate);

function getCpu() {
  return getMetricCPU(props.node, props.nodeType, isMaster.value).then((res) => {
    cpuCount.value = (res.data?.cpu || res.data?.cpu === 0) ? res.data?.cpu : null;
  });
}

function getCpuLoad() {
  return getMetricCPULoad(props.node, props.nodeType, isMaster.value).then((res) => {
    cpuData.dataVal = (res.data.cpuLoad || res.data.cpuLoad === 0) ? transformDecimal(res.data.cpuLoad * 100, 1) : null;
  });
}

function getDisk() {
  return getMetricDisk(props.node, isMaster.value).then((res) => {
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
    diskData.dataVal = transformDecimal(diskMemoryData.diskUseRatio * 100, 1);
  });
}

function getMemory() {
  return getMetricMemory(props.node, props.nodeType, isMaster.value).then((res) => {
    if (res.data) {
      memoryData.dataCount = res.data.memoryTotal;
      memoryData.valueUnit = res.data.unit;
      memoryData.dataVal = transformDecimal(res.data.memoryRatio * 100, 1);
    }
  });
}

function getFile() {
  return getMetricFileCount(props.node, props.nodeType, isMaster.value).then((res) => {
    fileTotal.value = res.data;
  });
}

function getIo() {
  return getMetricDiskIOUsedRate(props.node, isMaster.value).then((res) => {
    diskIOCategory.value = res.data.map((item) => item.diskName);
    diskIOData.value = res.data.map((item) => transformDecimal(item.nodeRate, 6));
  });
}

function initialAssign() {
  cpuCount.value = null;
  cpuData.dataVal = null;
  cpuData.dataCount = null;
  diskData.dataVal = 0;
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
  memoryData.dataVal = 0;
  memoryData.dataCount = null;
  fileTotal.value = null;
  diskIOCategory.value = [];
  diskIOData.value = [];
}

function getInitial() {
  Promise.allSettled([
    getCpu(),
    getCpuLoad(),
    getDisk(),
    getMemory(),
    getFile(),
    getIo(),
  ]).then(() => {
    emit('handleFetch');
  });
}

defineExpose({ getInitial, initialAssign });
</script>
