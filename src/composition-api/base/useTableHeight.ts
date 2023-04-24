import Calculator from '@/utils/calc';
import {
  computed, ref, onMounted, onUnmounted,
} from 'vue';

export default function useTableHeight(overflowMinHeight: number, overflowOtherHeight?: number) {
  const innerHeight = ref(window.innerHeight);
  const maxTableHeightOverflowMin = computed(() => (overflowMinHeight
    ? Calculator.subtract(innerHeight.value, overflowMinHeight) : innerHeight.value));
  const maxTableHeight = computed(() => ((overflowOtherHeight && innerHeight.value > 900)
    ? Calculator.subtract(maxTableHeightOverflowMin.value, overflowOtherHeight)
    : maxTableHeightOverflowMin.value));

  function onResize() {
    innerHeight.value = window.innerHeight;
  }
  onMounted(() => window.addEventListener('resize', onResize));
  onUnmounted(() => window.removeEventListener('resize', onResize));

  return {
    maxTableHeight,
  };
}
