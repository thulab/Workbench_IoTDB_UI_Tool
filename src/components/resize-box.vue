<template>
  <div>
    <div v-if="dialogVisible" class="draggable-box" :style="{ width: `${boxWidth}px`, height: `${boxHeight}px`, left: `${boxX}px`, top: `${boxY}px` }" @mousedown="startDrag">
      <div class="resize-handle" @mousedown.stop="startResize"></div>
      <div class="box-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  left: {
    type: Number,
    default: 100,
  },
  top: {
    type: Number,
    default: 100,
  },
  width: {
    type: Number,
    default: 300,
  },
  height: {
    type: Number,
    default: 160,
  },
});

const dialogVisible = defineModel<boolean>('visible');
const boxX = ref<number>(props.left);
const boxY = ref<number>(props.top);
const boxWidth = ref<number>(props.width);
const boxHeight = ref<number>(props.height);
const dragging = ref<boolean>(false);
const resizing = ref<boolean>(false);
const startX = ref<number>(0);
const startY = ref<number>(0);

const drag = (e: MouseEvent) => {
  if (!dragging.value) return;
  boxX.value = e.clientX - startX.value;
  boxY.value = e.clientY - startY.value;
  e.stopPropagation();
};

const stopDrag = () => {
  dragging.value = false;
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
};
const startDrag = (e: MouseEvent) => {
  dragging.value = true;
  startX.value = e.clientX - boxX.value;
  startY.value = e.clientY - boxY.value;

  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
  e.stopPropagation();
};
const resize = (e: MouseEvent) => {
  if (!resizing.value) return;
  const deltaX = e.clientX - startX.value;
  const deltaY = e.clientY - startY.value;

  boxWidth.value = Math.max(100, boxWidth.value + deltaX);
  boxHeight.value = Math.max(100, boxHeight.value + deltaY);

  startX.value = e.clientX;
  startY.value = e.clientY;
  e.stopPropagation();
};

const stopResize = () => {
  resizing.value = false;
  document.removeEventListener('mousemove', resize);
  document.removeEventListener('mouseup', stopResize);
};
const startResize = (e: MouseEvent) => {
  resizing.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;

  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
};
</script>

<style lang="scss" scoped>
.draggable-box {
  z-index: 2;
  position: fixed;
  border: 1px solid #656a85;
  box-shadow: 0;
  overflow: hidden;
  cursor: move;
  user-select: none;
}

.box-header {
  background: #e0e0e0;
  padding: 10px;
  cursor: move;
  user-select: none;
}

.resize-handle {
  z-index: 999;
  width: 10px;
  height: 10px;
  background: transparent;
  position: absolute;
  right: 0;
  bottom: 0;
  cursor: se-resize;
  border-left: 1px solid #656a85;
  border-top: 1px solid #656a85;
  transform: translate(50%, 50%) rotate(45deg);
}

.box-content {
  display: flex;
  width: 100%;
  height: 100%;
}
</style>
