<template>
  <div class="monitor-chart-wrapper">
    <div class="monitor-chart-box-4" v-loading="cpuLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 核数</h4>
        <data-container :is-empty="cpuCount === null">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">{{ cpuCount }}</p>
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-4" v-loading="cpuLoadLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">CPU 负载</h4>
        <div class="chart-container-box">
          <the-chart :option="cpuDataOptions" key="cpuLoad" />
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-4" v-loading="memoryLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">系统内存</h4>
        <data-container :is-empty="memoryData.dataCount === null">
          <div class="monitor-info-module-box">
            <p class="monitor-info-module-text">{{ memoryData.dataCount }}<span class="monitor-info-module-unit">{{ memoryData.valueUnit }}</span></p>
          </div>
        </data-container>
      </div>
    </div>
    <div class="monitor-chart-box-4" v-loading="memoryLoading">
      <div class="monitor-chart-container">
        <h4 class="monitor-info-module-title">内存使用情况</h4>
        <div class="chart-container-box">
          <the-chart :option="memoryDataOptions" key="memoryData" />
        </div>
      </div>
    </div>
    <div class="monitor-chart-box-4" v-loading="ioLoading">
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
import { transformDecimal } from '@/utils/format';
import { DashboardApi } from '@/api';
import DataContainer from './data-container.vue';

const props = defineProps<{
  node: string;
  nodeType: string;
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
  dataVal: 0,
  dataCount: null,
});

const memoryData = reactive<GaugeChartData>({
  themeColor: '#6738BD',
  opacityColor: '#A488D7',
  dataVal: 0,
  dataCount: null,
  valueUnit: 'GiB',
});

const diskIOCategory = ref<string[]>([]);
const diskIOData = ref<number[]>([]);

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

const cpuDataOptions = computed(() => gaugeChartOptions(cpuData));
const memoryDataOptions = computed(() => gaugeChartOptions(memoryData));
const diskIODataOptions = computed(() => diskIOChartOptions(diskIOCategory.value, diskIOData.value));

const { requestFn: getMetricCPU, loading: cpuLoading } = useRequest(DashboardApi.getMetricCPU);
const { requestFn: getMetricCPULoad, loading: cpuLoadLoading } = useRequest(DashboardApi.getMetricCPULoad);
const { requestFn: getMetricMemory, loading: memoryLoading } = useRequest(DashboardApi.getMetricMemory);
const { requestFn: getMetricDiskIOUsedRate, loading: ioLoading } = useRequest(DashboardApi.getMetricDiskIOUsedRate);

function getCpu() {
  getMetricCPU(props.node, props.nodeType).then((res) => {
    cpuCount.value = res.data?.cpu || null;
  });
}

function getCpuLoad() {
  getMetricCPULoad(props.node, props.nodeType).then((res) => {
    cpuData.dataVal = res.data.cpuLoad ? (res.data.cpuLoad * 100) : 0;
  });
}

function getMemory() {
  getMetricMemory(props.node, props.nodeType).then((res) => {
    if (res.data) {
      memoryData.dataCount = res.data.memoryUse;
      memoryData.valueUnit = res.data.unit;
      memoryData.dataVal = res.data.memoryRatio * 100;
    }
  });
}

function getIo() {
  getMetricDiskIOUsedRate(props.node).then((res) => {
    diskIOCategory.value = res.data.map((item) => item.diskName);
    diskIOData.value = res.data.map((item) => transformDecimal(item.nodeRate, 6));
  });
}

function getInitial() {
  getCpu();
  getCpuLoad();
  getMemory();
  getIo();
}

defineExpose({ getInitial });
</script>
