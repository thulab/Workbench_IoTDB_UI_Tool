<template>
  <resize-box :left="290" :top="220" :width="300" :height="160" v-model:visible="dialogVisible">
    <div class="echarts-box resizer">
      <the-chart :option="partOption" v-if="dialogVisible" key="part" ref="chartRef" :dark="true" />
    </div>
  </resize-box>
</template>
<script lang="ts" setup>
import TheChart from '@/components/the-chart.vue';
import type { ECOption } from '@/plugins/echarts-plugin';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  times: number[];
  values: string[];
}>();

const dialogVisible = defineModel<boolean>('visible');

const chartRef = ref<InstanceType<typeof TheChart>>();

const partOption = computed<ECOption>(() => {
  return {
    darkMode: true,
    toolbox: {
      show: true,
      feature: {
        dataZoom: {
          title: {
            zoom: t('common.zoom'),
            back: t('common.revoke'),
          },
          icon: {
            zoom: 'path://M15 9L23 9L23 23L9 23L9 15M13 9L9 9M9 9L5 9M9 13L9 9M9 9L9 5',
            back: 'path://M9,9h14v14H9v-8 M12,12L9,9l3-3',
          },
        },
        restore: {
          title: t('common.restore'),
          icon: 'path://M13 21L15 24C10.0294 24 6 19.9706 6 15C6 12.7036 6.86006 10.6081 8.27564 9.01797M17 9L15 6C19.9706 6 24 10.0294 24 15C24 17.3063 23.1325 19.4101 21.7059 21.0026',
        },
        saveAsImage: {
          title: t('common.export'),
          icon: 'path://M18,12V7H7v16h11v-5 M24,15H13 M21,18l3-3l-3-3',
        },
      },
    },
    // backgroundColor: '#100C29',
    grid: {
      left: 10,
      right: 20,
      bottom: 10,
      top: 30,
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      splitNumber: 2,
    },
    yAxis: {
      type: 'value',
      scale: true,
    },
    series: [
      {
        type: 'line',
        symbol: 'circle',
        showSymbol: false,
        showAllSymbol: 'auto',
        connectNulls: false,
        symbolSize: 4,
        data: props.values.map((dataItem, index) => [props.times[index], dataItem]),
        lineStyle: {
          width: 2,
          color: '#4992ff',
        },
        itemStyle: {
          color: '#4992ff',
        },
      },
    ],
  };
});
onMounted(() => {});
</script>

<style lang="scss" scoped>
.echarts-box {
  width: 100%;
  height: 100%;
}
</style>
