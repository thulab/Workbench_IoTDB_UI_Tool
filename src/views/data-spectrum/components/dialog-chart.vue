<template>
  <el-dialog
    class="chart-dialog"
    v-model:model-value="dialogVisible"
    destroy-on-close
    :title="t('spectrum.dragTip')"
    draggable
    :modal="false"
    append-to-body
    width="775"
    style="padding: 0 !important"
    :close-on-click-modal="false"
  >
    <div class="echarts-box">
      <the-chart :option="partOption" key="part" ref="chartRef" />
    </div>
  </el-dialog>
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
    backgroundColor: '#100C29',
    grid: {
      left: 20,
      right: 60,
      bottom: 20,
      containLabel: true,
    },
    xAxis: {
      data: props.times,
    },
    yAxis: {
      type: 'value',
      scale: true,
      show: false,
    },
    series: [
      {
        type: 'line',
        symbol: 'circle',
        showSymbol: false,
        showAllSymbol: 'auto',
        connectNulls: false,
        symbolSize: 4,
        data: props.values,
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
  width: 773px;
  height: 335px;
}
</style>
<style lang="scss">
.chart-dialog {
  border: 1px solid #dfe1ed;

  // box-shadow: 0 0 10px 5px rgb(255 255 255 / 50%);
  .el-dialog__headerbtn {
    top: 4px !important;
    right: 4px !important;
  }

  .el-dialog__header {
    text-align: center;
    padding: 2px 0 !important;
  }

  .el-dialog__body {
    padding: 0 !important;
  }
}
</style>
