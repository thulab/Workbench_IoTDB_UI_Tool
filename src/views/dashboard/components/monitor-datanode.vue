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
            <i class="legeng-icon" style="background-color: #495AD4;"></i>磁盘已用空间
          </p>
          <p class="monitor-info-legend">
            <i class="legeng-icon" style="background-color: #009DEA;"></i>IoTDB 已用空间
          </p>
        </div>
        <data-container :is-empty="diskData.dataCount === null">
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
        <data-container :is-empty="diskData.dataCount === null">
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

interface DiskMemoryDetail {
  diskTotal: number;
  totalUnit: string;
  diskMemory: string;
  diskMemoryVal: number;
  ioTDBMemory: string;
  ioTDBMemoryVal: number;
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

const diskMemoryData = reactive<DiskMemoryDetail>({
  diskTotal: 0,
  totalUnit: '',
  diskMemory: '',
  diskMemoryVal: 0,
  ioTDBMemory: '',
  ioTDBMemoryVal: 0,
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

const diskChartOptions = (diskMemoryChartData: DiskMemoryDetail): ECOption => ({
  tooltip: {
    show: false,
  },
  grid: {
    left: 10,
    right: 40,
    top: 20,
    bottom: 20,
    containLabel: true,
  },
  barWidth: 20,
  yAxis: {
    type: 'category',
    data: ['IoTDB 已用空间', '磁盘已用空间'],
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
    },
  },
  xAxis: {
    type: 'value',
    max: diskMemoryChartData.diskTotal,
    axisLabel: {
      showMaxLabel: true,
      color: '#424561',
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
      type: 'bar',
      data: [
        {
          name: 'IoTDB 已用空间',
          value: diskMemoryChartData.ioTDBMemoryVal,
          itemStyle: {
            color: '#009DEA',
          },
          label: {
            show: true,
            position: 'right',
            formatter: diskMemoryChartData.ioTDBMemory,
            fontSize: 12,
            fontWeight: 700,
            color: '#009DEA',
          },
        },
        {
          name: '磁盘已用空间',
          value: diskMemoryChartData.diskMemoryVal,
          itemStyle: {
            color: '#495AD4',
          },
          label: {
            show: true,
            position: 'right',
            formatter: diskMemoryChartData.diskMemory,
            fontSize: 12,
            fontWeight: 700,
            color: '#495AD4',
          },
        },
      ],
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
    const {
      diskTotal, totalUnit, diskUse, useUnit, diskUseRatio, ioTDBUse, ioTDBUnit, ioTDBUseRatio,
    } = res.data;
    diskMemoryData.diskTotal = diskTotal;
    diskMemoryData.totalUnit = totalUnit || '';
    diskMemoryData.diskMemory = `${diskUse} ${useUnit}`;
    diskMemoryData.diskMemoryVal = diskUseRatio * diskTotal;
    diskMemoryData.ioTDBMemory = `${ioTDBUse} ${ioTDBUnit}`;
    diskMemoryData.ioTDBMemoryVal = ioTDBUseRatio * diskTotal;
    diskData.dataCount = diskTotal;
    diskData.dataVal = transformDecimal(diskUseRatio * 100, 1);
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
  diskData.dataCount = null;
  diskMemoryData.diskTotal = 0;
  diskMemoryData.totalUnit = '';
  diskMemoryData.diskMemory = '';
  diskMemoryData.diskMemoryVal = 0;
  diskMemoryData.ioTDBMemory = '';
  diskMemoryData.ioTDBMemoryVal = 0;
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
