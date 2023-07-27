<template>
  <div ref="chartContainer" style="height: 100%;" v-element-size="onResize"></div>
</template>

<script lang="ts" setup>
import { vElementSize } from '@vueuse/components';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import {
  ref, onMounted, onUnmounted, watch, nextTick,
} from 'vue';
import { debounce } from 'lodash-es';

const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;

const props = defineProps<
{
  option: ECOption
}>();

const setOption = (option:ECOption) => {
  if (chartInstance) {
    // 实例存在直接设置
    chartInstance.setOption(option);
  } else if (chartContainer.value && chartContainer.value.clientHeight) {
    // 实例不存在，容器存在，容器高度存在
    chartInstance = echarts.init(chartContainer.value);
    // 初次加载，设置notMerge为true
    chartInstance.setOption(option, true);
  } else {
    // 容器高度有问题时，延迟加载
    setTimeout(() => {
      setOption(option);
    }, 100);
  }
};

const onResize = debounce(() => {
  if (chartInstance) {
    chartInstance.resize();
  }
}, 30);

watch(
  () => props.option,
  (newOption) => {
    setOption(newOption);
  },
  { deep: true },
);

onMounted(() => {
  if (props.option) {
    setOption(props.option);
  }
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.clear();
    chartInstance.dispose();
  }
});

</script>
