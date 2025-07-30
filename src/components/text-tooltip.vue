<template>
  <el-tooltip :disabled="tooltipDisabled" :content="props.content" :placement="placement" :show-after="500" effect="light" popper-class="tooltip-max-width">
    <div class="over-flow" :class="props.className" @mouseover="onMouseOver('contentRef')" @focus="onMouseOver('contentRef')">
      <span ref="contentRef" :class="props.spanClassName">{{ content || '-' }}</span>
    </div>
  </el-tooltip>
</template>
<script setup lang="ts">
import type { Placement } from 'element-plus';
import { getCurrentInstance, ref } from 'vue';

const { proxy }: any = getCurrentInstance();
const props = withDefaults(
  defineProps<{
    content: string;
    className?: string;
    spanClassName?: string;
    placement?: Placement;
  }>(),
  {
    placement: 'top',
  },
);
const tooltipDisabled = ref(true);
const onMouseOver = (str: string) => {
  const parentWidth: number = proxy.$refs[str].parentNode.offsetWidth;
  const contentWidth: number = proxy.$refs[str].offsetWidth;
  if (contentWidth > parentWidth) {
    tooltipDisabled.value = false;
  } else {
    tooltipDisabled.value = true;
  }
};
</script>
<style lang="scss" scoped>
.tooltip {
  max-width: 500px;
}

.over-flow {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: inline;
}
</style>
<style lang="scss">
.tooltip-max-width {
  max-width: 500px;
}
</style>
