import Calculator from '@/utils/calc';
import { computed, ref, onMounted, onUnmounted } from 'vue';

/**
 * 计算表格高度
 * @param overflowMinHeight 其他区域高度
 * @param overflowOtherHeight
 * @param minHeight 最小表格高度
 * @returns
 */
export default function useTableHeight(overflowMinHeight: number, overflowOtherHeight?: number, minHeight?: number) {
  const innerHeight = ref(window.innerHeight);
  const maxTableHeightOverflowMin = computed(() => (overflowMinHeight ? Calculator.subtract(innerHeight.value, overflowMinHeight) : innerHeight.value));
  const maxTableHeight = computed(() => {
    const calcMinHeight = overflowOtherHeight && innerHeight.value > 900 ? Calculator.subtract(maxTableHeightOverflowMin.value, overflowOtherHeight) : maxTableHeightOverflowMin.value;
    if (minHeight && calcMinHeight < minHeight) {
      return minHeight;
    }
    return calcMinHeight;
  });

  function onResize() {
    innerHeight.value = window.innerHeight;
  }
  onMounted(() => window.addEventListener('resize', onResize));
  onUnmounted(() => window.removeEventListener('resize', onResize));

  return {
    maxTableHeight,
  };
}
