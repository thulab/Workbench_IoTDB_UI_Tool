<template>
  <div
    :class="wrapClassName"
    :style="{
      width: `${wrapStyle.width}px`,
      height: `${wrapStyle.height}px`,
      overflow: 'hidden',
      position: 'relative',
    }"
  >
    <!--    style="overflow-x: scroll"-->
    <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
    <div
      :class="['virtualized-tree-scroll', className]"
      :style="
        {
          'overflow-x': myScrollClassOverflow,
        } as StyleValue
      "
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseleave"
    >
      <!--      :height="280"-->
      <el-tree-v2
        v-bind="$attrs"
        :height="(wrapStyle.height as unknown as number) - 10"
        :style="{
          width,
        }"
        ref="virtualizedTreeRef"
      >
        <!-- 遍历子组件作用域插槽，并对父组件暴露 -->
        <template v-for="(index, name) in $slots" v-slot:[name]="data">
          <slot :name="name" v-bind="data"></slot>
        </template>
      </el-tree-v2>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref, type StyleValue } from 'vue';
import * as _ from 'lodash-es';
import type { ElTreeV2 } from 'element-plus';
import { VirtualizedTreeProps } from './virtualized-tree';
import useMutationObserver from './useMutationObserver';

const { uniqueId, isNumber } = _;
// 解决浏览器审查模式下 最外层额外显示的props
defineOptions({
  inheritAttrs: false,
});

const emit = defineEmits<{
  (event: 'handleScroll', payload: number): void;
}>();

// #region <移入移出>
const myScrollClassOverflow = ref('hidden');
const onMouseEnter = () => {
  myScrollClassOverflow.value = 'scroll';
};
const onMouseleave = () => {
  myScrollClassOverflow.value = 'hidden';
};

// #endregion
// #region <实现>
const className = uniqueId('yh-scroll-v-tree');
const wrapClassName = uniqueId('yh-scroll-tree-v-wrap');
const props = defineProps(VirtualizedTreeProps);
const width = ref(`${props.width}px`);
// #region <处理未传入宽高的情况>
const wrapStyle = ref({
  width: props.width,
  height: props.height,
});
const fatherDom = ref<HTMLElement>();
const virtualizedTreeRef = ref<InstanceType<typeof ElTreeV2>>();
const autoSetWidth = (dom: HTMLElement) => {
  if (!props.width) {
    wrapStyle.value.height = dom?.clientHeight || 0;
  }
};
const autoSetHeight = (dom: HTMLElement) => {
  if (!props.height) {
    wrapStyle.value.width = dom?.clientWidth || 0;
  }
};
const autoSetWrapStyle = () => {
  if (!fatherDom.value) return;
  autoSetWidth(fatherDom.value);
  autoSetHeight(fatherDom.value);
};
const initWrapStyle = () => {
  // 没有传递宽高
  if (!props.height || !props.width) {
    fatherDom.value = document.querySelector(`.${wrapClassName}`)?.parentNode as HTMLElement;
    autoSetWrapStyle();
    window.addEventListener('resize', autoSetWrapStyle);
  }
};
function handleScroll() {
  const scrollLeft = (document.querySelector('.virtualized-tree-scroll')?.scrollLeft || 0) + 212;
  emit('handleScroll', scrollLeft);
}

onUnmounted(() => {
  window.removeEventListener('resize', autoSetWrapStyle);
  document.querySelector('.virtualized-tree-scroll')?.removeEventListener('scroll', handleScroll);
});
onMounted(() => {
  initWrapStyle();
  document.querySelector('.virtualized-tree-scroll')?.addEventListener('scroll', handleScroll);
});
// #endregion
const callback = () => {
  // 寻找宽度
  let maxWidth = 0;
  let maxPaddingLeft = 0;
  let checkBoxWidth = 0;
  // 获取虚拟树dom
  const treeDom = document.querySelector(`.${wrapClassName} .${className} .el-tree .el-tree-virtual-list`);
  try {
    Array.from(treeDom?.children?.[0]?.children as unknown as HTMLElement[])?.forEach((item: HTMLElement) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      getWidth(item);
    });
  } catch (e) {
    return;
  }
  // 是否存在checkbox
  const checkbox = document.querySelector(`.${wrapClassName} .${className} .el-tree .el-tree-virtual-list .el-checkbox`) as HTMLElement;
  if (checkbox) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define, no-unsafe-optional-chaining
    const checkBoxMargin = +getElNodeAttrValue(checkbox, 'margin-right')?.split('px')?.[0] || 0;
    const checkBoxClientWidth = checkbox.clientWidth;
    checkBoxWidth = checkBoxMargin + checkBoxClientWidth;
  }

  // // 寻找最小宽度
  const minWidthNode = document.querySelector(`.${wrapClassName}`);
  const minWidth = minWidthNode?.clientWidth || 0;
  const targetWidth = maxWidth + maxPaddingLeft + checkBoxWidth;
  width.value = isNumber(targetWidth) ? `${targetWidth > minWidth ? targetWidth : minWidth}px` : '100%';
  handleScroll();
  function getWidth(el: HTMLElement) {
    const elWidthNode = Array.from(el.children).find((item) => {
      return Array.from(item.classList || []).includes('el-tree-node__content');
    }) as HTMLElement;
    if (elWidthNode) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define, no-unsafe-optional-chaining
      const paddingLeftValue = +getElNodeAttrValue(elWidthNode, 'padding-left')?.split('px')?.[0] || 0;
      const elWidthNodeList = elWidthNode?.children || ([] as HTMLElement[]);
      let elWidth = 0;
      // 获取padding
      Array.from(elWidthNodeList).forEach((item) => {
        elWidth += item.clientWidth;
      });

      maxWidth = maxWidth > elWidth ? maxWidth : elWidth;
      maxPaddingLeft = maxPaddingLeft > paddingLeftValue ? maxPaddingLeft : paddingLeftValue;
    }

    if (el.ariaExpanded === 'false') {
      return;
    }
    if (el.children) {
      Array.from(el.children as unknown as HTMLElement[]).forEach((item: HTMLElement) => {
        getWidth(item);
      });
    }
  }
};
const getElNodeAttrValue = (el: HTMLElement, attrKey: string) => {
  const computedStyles = getComputedStyle(el);
  return computedStyles.getPropertyValue(attrKey) as string;
};
useMutationObserver(`.${wrapClassName} .${className} .el-tree`, callback);

// #endregion

defineExpose({ virtualizedTreeRef });
</script>
<style lang="scss" scoped>
:deep(.virtualized-tree-scroll) {
  .el-tree {
    position: static;

    .el-vl__wrapper {
      position: static;
    }
  }
}
</style>
