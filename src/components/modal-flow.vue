<template>
  <el-dialog
    title="流程图管理"
    v-model="dialogVisible"
    width="1024px"
    align-center
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    id="flow-graph-modal"
    :before-close="handleClose"
  >
    <el-container class="flow-graph-container p-0" :style="{ height: maxHeight + 'px' }">
      <el-header class="detail-title-box">
        <h4 class="detail-title-text">数据流程图</h4>
        <div class="operate-buttons">
        </div>
      </el-header>
      <el-main class="p-0">
        <div class="flow-container" id="flow-container">
          <div class="flow-stencil-wrapper" ref="stencilContainerRef"></div>
          <div class="flow-graph-wrapper" ref="graphContainerRef" id="graph-container"></div>
          <div class="flow-operate-wrapper"></div>
        </div>
      </el-main>
    </el-container>
  </el-dialog>
</template>

<script lang="ts" setup>
import { Graph, Shape } from '@antv/x6';
import { Stencil } from '@antv/x6-plugin-stencil';
import { Snapline } from '@antv/x6-plugin-snapline';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { History } from '@antv/x6-plugin-history';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Transform } from '@antv/x6-plugin-transform';
import { Scroller } from '@antv/x6-plugin-scroller';
import { Export } from '@antv/x6-plugin-export';
import { register, getTeleport } from '@antv/x6-vue-shape';
import { ConnectionApi } from '@/api';
import connectionClusterSvg from '@/assets/icons/connection-cluster.svg';
import connectionDoubleLiveSvg from '@/assets/icons/connection-double-live.svg';
import connectionStandAloneSvg from '@/assets/icons/connection-stand-alone.svg';
import CustomVueNode from './flow-graph/custom-vue-node.vue';

const props = defineProps<{
  visible: boolean;
  isToggle?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleClose', id?: number): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const stencilContainerRef = ref<HTMLElement | null>(null);
const graphContainerRef = ref<HTMLElement | null>(null);
const graph = ref<Graph>();
const stencil = ref<Stencil>();
const connectionList = ref<Connection.ConnectionItem[]>([]);
const standAloneList = ref<Connection.ConnectionItem[]>([]);
const doubleLiveList = ref<Connection.ConnectionItem[]>([]);
const clusterList = ref<Connection.ConnectionItem[]>([]);
const listLoading = ref(false);

const maxHeight = computed(() => window.innerHeight - 100);

const { requestFn: getConnectionList } = useRequest(ConnectionApi.getConnectionList);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleClose() {
  dialogVisible.value = false;
  emit('handleClose');
}

// #region 初始化图形
const ports = {
  groups: {
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    right: {
      position: 'right',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
    left: {
      position: 'left',
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 1,
          fill: '#fff',
          style: {
            visibility: 'hidden',
          },
        },
      },
    },
  },
  items: [
    {
      group: 'top',
    },
    {
      group: 'right',
    },
    {
      group: 'bottom',
    },
    {
      group: 'left',
    },
  ],
};

register({
  shape: 'custom-vue-node',
  component: CustomVueNode,
  width: 52,
  height: 52,
  markup: [
    {
      tagName: 'rect',
      selector: 'body',
    },
    {
      tagName: 'image',
    },
    {
      tagName: 'text',
      selector: 'label',
    },
  ],
  attrs: {
    body: {
      stroke: '#5F95FF',
      fill: '#5F95FF',
    },
    image: {
      width: 26,
      height: 26,
      refX: 13,
      refY: 16,
    },
    label: {
      refX: 3,
      refY: 2,
      textAnchor: 'left',
      textVerticalAnchor: 'top',
      fontSize: 12,
      fill: '#fff',
    },
  },
  ports: { ...ports },
});

Graph.registerNode(
  'custom-rect',
  {
    inherit: 'rect',
    width: 66,
    height: 36,
    attrs: {
      body: {
        strokeWidth: 1,
        stroke: '#5F95FF',
        fill: '#EFF4FF',
      },
      text: {
        fontSize: 12,
        fill: '#262626',
      },
    },
    ports: { ...ports },
    tools: [
      {
        name: 'node-editor',
        args: {
          attrs: {
            backgroundColor: '#EFF4FF',
          },
        },
      },
    ],
  },
  true,
);

Graph.registerNode(
  'custom-image',
  {
    inherit: 'rect',
    width: 52,
    height: 52,
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'image',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
    ],
    attrs: {
      body: {
        stroke: '#5F95FF',
        fill: '#5F95FF',
      },
      image: {
        width: 26,
        height: 26,
        refX: 13,
        refY: 16,
      },
      label: {
        refX: 3,
        refY: 2,
        textAnchor: 'left',
        textVerticalAnchor: 'top',
        fontSize: 12,
        fill: '#fff',
      },
    },
    ports: { ...ports },
  },
  true,
);

function initialGraph() {
  // #region 初始化画布
  graph.value = new Graph({
    container: graphContainerRef.value!,
    grid: true,
    mousewheel: {
      enabled: true,
      zoomAtMousePosition: true,
      modifiers: 'ctrl',
      minScale: 0.5,
      maxScale: 3,
    },
    connecting: {
      router: 'manhattan',
      connector: {
        name: 'rounded',
        args: {
          radius: 8,
        },
      },
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,
      snap: {
        radius: 20,
      },
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#A2B1C3',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
              },
            },
          },
          zIndex: 0,
        });
      },
      validateConnection({ targetMagnet }) {
        return !!targetMagnet;
      },
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#5F95FF',
            stroke: '#5F95FF',
          },
        },
      },
    },
  });

  // #region 使用插件
  graph.value
    .use(new Snapline())
    .use(new Clipboard())
    .use(new History())
    .use(new Keyboard())
    .use(new Transform({
      resizing: true,
      rotating: true,
    }))
    .use(new Scroller({
      enabled: true,
      pannable: true,
    }))
    .use(new Export());

  graph.value.centerContent();

  // #region 初始化 stencil
  stencil.value = new Stencil({
    title: '流程图',
    target: graph.value,
    stencilGraphWidth: 200,
    stencilGraphHeight: 0,
    collapsable: false,
    groups: [
      {
        title: '基础图形',
        name: 'group1',
        collapsed: false,
      },
      {
        title: '单机实例',
        name: 'group2',
        collapsed: false,
      },
      {
        title: '集群实例',
        name: 'group3',
        collapsed: false,
      },
      {
        title: '双活实例',
        name: 'group4',
        collapsed: false,
      },
    ],
    layoutOptions: {
      columns: 3,
      columnWidth: 60,
      rowHeight: 55,
    },
  });

  stencilContainerRef.value!.appendChild(stencil.value.container);
  // document.getElementById('stencil')!.appendChild(stencil.value.container);
}

// 控制连接桩显示/隐藏
const showPorts = (portList: NodeListOf<SVGElement>, show: boolean) => {
  for (let i = 0, len = portList.length; i < len; i += 1) {
    portList[i].style.visibility = show ? 'visible' : 'hidden';
  }
};

function graphWatchEvent() {
  graph.value?.on('node:mouseenter', () => {
    const container = document.getElementById('graph-container')!;
    const allPorts = container.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>;
    showPorts(allPorts, true);
  });
  graph.value?.on('node:mouseleave', () => {
    const container = document.getElementById('graph-container')!;
    const allPorts = container.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>;
    showPorts(allPorts, false);
  });
}

// #region 快捷键与事件
function graphBindEvent() {
  graph.value?.bindKey(['ctrl+c'], () => {
    const cells = graph.value?.getSelectedCells();
    if (cells.length) {
      graph.value?.copy(cells);
    }
    return false;
  });
  graph.value?.bindKey(['ctrl+x'], () => {
    const cells = graph.value?.getSelectedCells();
    if (cells.length) {
      graph.value?.cut(cells);
    }
    return false;
  });
  graph.value?.bindKey(['ctrl+v'], () => {
    if (!graph.value?.isClipboardEmpty()) {
      const cells = graph.value?.paste({ offset: 32 });
      graph.value?.cleanSelection();
      graph.value?.select(cells);
    }
    return false;
  });

  // undo redo
  graph.value?.bindKey(['ctrl+z'], () => {
    if (graph.value?.canUndo()) {
      graph.value?.undo();
    }
    return false;
  });
  graph.value?.bindKey(['ctrl+shift+z'], () => {
    if (graph.value?.canRedo()) {
      graph.value?.redo();
    }
    return false;
  });

  // select all
  graph.value?.bindKey(['ctrl+a'], () => {
    const nodes = graph.value?.getNodes();
    if (nodes) {
      graph.value?.select(nodes);
    }
  });

  // delete
  graph.value?.bindKey('backspace', () => {
    const cells = graph.value?.getSelectedCells();
    if (cells.length) {
      graph.value?.removeCells(cells);
    }
  });

  // zoom
  graph.value?.bindKey(['ctrl+1'], () => {
    const zoom = graph.value?.zoom();
    if (zoom! < 1.5) {
      graph.value?.zoom(0.1);
    }
  });
  graph.value?.bindKey(['ctrl+2'], () => {
    const zoom = graph.value?.zoom();
    if (zoom! > 0.5) {
      graph.value?.zoom(-0.1);
    }
  });
}

// 获取实例列表
function getList() {
  listLoading.value = true;
  return getConnectionList().then((res) => {
    const data = res.data || [];
    data.forEach((item) => {
      if (item.type === 1) {
        clusterList.value.push(item);
      } else if (item.type === 2) {
        doubleLiveList.value.push(item);
      } else {
        standAloneList.value.push(item);
      }
    });
    connectionList.value = [...standAloneList.value, ...clusterList.value, ...doubleLiveList.value];
  }).finally(() => {
    listLoading.value = false;
  });
}

function loadStencil() {
  const baseNode = graph.value?.createNode({
    shape: 'custom-rect',
    label: '文字输入',
  });
  const standAloneNodes = standAloneList.value.map((item) => graph.value?.createNode({
    shape: 'custom-vue-node',
    label: item.name,
    attrs: {
      image: {
        'xlink:href': connectionStandAloneSvg,
      },
    },
  }));
  const clusterNodes = clusterList.value.map((item) => graph.value?.createNode({
    shape: 'custom-vue-node',
    label: item.name,
    attrs: {
      image: {
        'xlink:href': connectionClusterSvg,
      },
    },
  }));
  const doubleLiveNodes = doubleLiveList.value.map((item) => graph.value?.createNode({
    shape: 'custom-vue-node',
    label: item.name,
    attrs: {
      image: {
        'xlink:href': connectionDoubleLiveSvg,
      },
    },
  }));
  stencil.value?.load([baseNode] as (Node | Node.Metadata)[], 'group1');
  stencil.value?.load(standAloneNodes as (Node | Node.Metadata)[], 'group2');
  stencil.value?.load(clusterNodes as (Node | Node.Metadata)[], 'group3');
  stencil.value?.load(doubleLiveNodes as (Node | Node.Metadata)[], 'group4');
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        initialGraph();
        graphWatchEvent();
        graphBindEvent();
        getList().then(() => {
          loadStencil();
        });
      });
    } else {
      graph.value?.dispose();
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
  border: 1px solid #dfe3e8;
  box-sizing: border-box;
}

.flow-stencil-wrapper{
  width: 200px;
  height: 100%;
  position: relative;
  border-right: 1px solid #dfe3e8;
}

.flow-graph-wrapper{
  width: calc(100% - 400px);
  height: 100%;
}

.flow-operate-wrapper{
  width: 200px;
}
</style>
