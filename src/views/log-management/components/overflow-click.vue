<template>
  <div class="over-flow" :class="props.className" ref="contentRef" @click="handleVisible('contentRef')">
    {{ content || '-' }}
  </div>
</template>

<script setup lang="ts">
const { proxy }: any = getCurrentInstance();
const props = withDefaults(
  defineProps<{
    content: string;
    className?: string;
    spanClassName?: string;
    offset?: number;
  }>(),
  {}
);
const emit = defineEmits<{
  (event: 'handleClick'): void;
}>();

const handleVisible = (str: string) => {
  const parentWidth: number = props.offset ? proxy.$refs[str].parentNode.offsetWidth - props.offset : proxy.$refs[str].parentNode.offsetWidth;
  const contentWidth: number = proxy.$refs[str].offsetWidth;
  if (contentWidth > parentWidth) {
    emit('handleClick');
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
