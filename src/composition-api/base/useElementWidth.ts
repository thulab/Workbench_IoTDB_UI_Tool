import Calculator from '@/utils/calc';
import { computed } from 'vue';
import { useWindowSize } from '@vueuse/core';

/**
 * 计算元素宽度, 最小为 100px
 * @param otherFixedWidth 其他区域固定宽度
 * @returns
 */
export default function useElementWidth(otherFixedWidth: number) {
  const { width } = useWindowSize();

  const elementWidth = computed(() => {
    return width.value > 1440 ? Calculator.subtract(width.value, otherFixedWidth) : Calculator.subtract(1440, otherFixedWidth);
  });
  return {
    elementWidth,
  };
}
