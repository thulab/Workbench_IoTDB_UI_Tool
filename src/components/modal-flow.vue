<template>
  <el-dialog
    title="实例管理"
    v-model="dialogVisible"
    width="780px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    id="connection-modal"
    :before-close="handleClose"
  >
    <el-container class="page-container p-0">
      <el-header class="detail-title-box">
        <h4 class="detail-title-text">数据流程图</h4>
        <div class="operate-buttons">
        </div>
      </el-header>
      <el-main class="p-0">
        <div class="flow-container">
          <div class="flow-node-wrapper" ref="dndContainerRef">
            <div data-type="rect" class="dnd-rect" @mousedown="startDrag">Rect</div>
            <div data-type="circle" class="dnd-circle" @mousedown="startDrag">Circle</div>
          </div>
          <div class="flow-graph-wrapper" ref="graphContainerRef"></div>
          <div class="flow-operate-wrapper"></div>
        </div>
      </el-main>
    </el-container>
  </el-dialog>
</template>

<script lang="ts" setup>
import { Graph } from '@antv/x6';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Snapline } from '@antv/x6-plugin-snapline';

const props = defineProps<{
  visible: boolean;
  isToggle?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleClose', id?: number): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const dndContainerRef = shallowRef<HTMLDivElement>();
const graphContainerRef = shallowRef<HTMLDivElement>();
const graph = ref<Graph>();
const dnd = ref<Dnd>();

function handleClose() {
  dialogVisible.value = false;
  emit('handleClose');
}

function initialGraph() {
  graph.value = new Graph({
    container: graphContainerRef.value,
    background: {
      color: '#F2F7FA',
    },
    mousewheel: {
      enabled: true,
      modifiers: ['ctrl', 'meta'],
    },
  });

  graph.value.use(
    new Snapline({
      enabled: true,
      sharp: true,
    }),
  );

  const source = graph.value.addNode({
    x: 130,
    y: 30,
    width: 100,
    height: 40,
    label: 'Hello',
    attrs: {
      body: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
        fill: '#fff',
        rx: 6,
        ry: 6,
      },
    },
  });

  const target = graph.value.addNode({
    x: 180,
    y: 160,
    width: 100,
    height: 40,
    label: 'World',
    attrs: {
      body: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
        fill: '#fff',
        rx: 6,
        ry: 6,
      },
    },
  });

  graph.value.addEdge({
    source,
    target,
    attrs: {
      line: {
        stroke: '#8f8f8f',
        strokeWidth: 1,
      },
    },
  });

  graph.value.centerContent();

  dnd.value = new Dnd({
    target: graph.value,
    scaled: false,
    dndContainer: dndContainerRef.value,
  });
}

function startDrag(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const type = target.getAttribute('data-type');
  const node = type === 'rect'
    ? graph.value?.createNode({
      width: 100,
      height: 40,
      label: 'Rect',
      attrs: {
        body: {
          stroke: '#8f8f8f',
          strokeWidth: 1,
          fill: '#fff',
          rx: 6,
          ry: 6,
        },
      },
    })
    : graph.value?.createNode({
      width: 60,
      height: 60,
      shape: 'circle',
      label: 'Circle',
      attrs: {
        body: {
          stroke: '#8f8f8f',
          strokeWidth: 1,
          fill: '#fff',
        },
      },
    });
  dnd.value?.start(node as any, e as any);
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      initialGraph();
    }
  },
);
</script>

<style lang="scss" scoped>
.detail-title-box{
  height: 41px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #DFE1ED;
  padding: 0 16px;
  box-sizing: border-box;

  .detail-title-text{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
}

.flow-container{
  width: 100%;
  height: 100%;
  display: flex;
}

.flow-node-wrapper{
  flex: 0 0 200px;
}

.flow-graph-wrapper{
  flex: 1;
}

.dnd-rect {
  width: 100px;
  height: 40px;
  margin: 16px;
  line-height: 40px;
  text-align: center;
  border: 1px solid #8f8f8f;
  border-radius: 6px;
  cursor: move;
}

.dnd-circle {
  width: 60px;
  height: 60px;
  margin: 16px;
  line-height: 60px;
  text-align: center;
  border: 1px solid #8f8f8f;
  border-radius: 100%;
  cursor: move;
}

.flow-operate-wrapper{
  flex: 0 0 200px;
}
</style>
