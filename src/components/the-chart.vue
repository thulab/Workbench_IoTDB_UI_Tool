<template>
  <div ref="chartContainer" style="height: 100%" v-element-size="onResize"></div>
</template>

<script lang="ts" setup>
import { vElementSize } from '@vueuse/components';
import { echarts, type ECOption } from '@/plugins/echarts-plugin';
import { debounce } from 'lodash-es';

const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts;

const props = defineProps<{
  option: ECOption;
  dark?: boolean;
  clickFunc?: Function;
}>();

const legendSelected = ref<{ [key: string]: boolean }>({});

const setOption = (option: ECOption) => {
  if (chartInstance) {
    // 实例存在直接设置
    chartInstance.setOption(option);
  } else if (chartContainer.value && chartContainer.value.clientHeight) {
    // 实例不存在，容器存在，容器高度存在
    chartInstance = echarts.init(chartContainer.value, props.dark ? 'dark' : 'light');
    // 若存在click事件，执行
    chartInstance.on('click', (params) => {
      if (props.clickFunc) {
        props.clickFunc(params);
      }
    });
    // 监听图例选择状态变化的事件
    // { name: string, selected: { [name: string]: boolean } }
    chartInstance.on('legendselectchanged', (params: any) => {
      // 当图例选择状态发生变化时，可以在这里处理逻辑
      legendSelected.value = params.selected;
    });
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
  { deep: true }
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

defineExpose({
  legendSelected,
});
</script>
