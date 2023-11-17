<template>
  <el-dialog
    title="流程图管理"
    v-model="dialogVisible"
    width="1024px"
    align-center
    fullscreen
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    id="flow-graph-modal"
    class="flow-graph-modal"
    :show-close="false"
    :before-close="handleClose"
  >
    <template #header>
      <div class="flow-graph-operate-header">
        <div class="flow-graph-operate-left">
          <el-button link class="flow-graph-close-btn" @click="handleClose"><el-icon size="24" class="m-r-6"><i-custom-close /></el-icon>返回</el-button>
          <span class="flow-graph-header-title">拓扑图</span>
        </div>
        <div class="operate-buttons" v-if="editType === 'edit'">
          <el-button link @click="handleSaveView" :loading="saveLoading"><el-icon size="24" class="m-r-6"><i-custom-circle-close-half /></el-icon>退出编辑</el-button>
          <el-button link @click="handleEmpty"><el-icon size="24" class="m-r-6"><i-custom-delete /></el-icon>清空</el-button>
        </div>
        <div class="operate-buttons" v-if="editType === 'view'">
          <el-button link @click="handleEdit"><el-icon size="24" class="m-r-6"><i-custom-edit /></el-icon>编辑</el-button>
          <!-- <el-button link @click="handleExport"><el-icon size="24" class="m-r-6"><i-custom-export /></el-icon>导出</el-button> -->
        </div>
      </div>
    </template>
    <el-container class="flow-graph-container p-0">
      <el-main class="p-0">
        <div class="flow-container" id="flow-container" v-loading="graphLoading">
          <TeleportContainer />
          <ContextMenu v-show="isShowContextMenu" ref="contextMenuRef" @handleClickOperate="handleClickOperate" />
          <div class="flow-stencil-wrapper" ref="stencilContainerRef" v-show="isEdit" v-loading="listLoading"></div>
          <div class="flow-graph-wrapper" ref="graphContainerRef" id="graph-container"></div>
          <div class="flow-operate-wrapper" v-show="isEdit && (isShowTextStyle || isShowNodeStyle || isShowEdgeStyle)">
            <!-- 文本 -->
            <div v-show="isShowTextStyle" class="text-style-box">
              <h4 class="operate-style-title">样式</h4>
              <div class="text-style-detail-item">
                <span class="detail-label">文字大小：</span>
                <el-input-number
                  v-model.number="textStyle.fontSize"
                  :min="1"
                  :max="100"
                  step-strictly
                  :controls="false"
                  @change="val => handleChangeTextFontSize(val as number)"
                  @blur="ev => handleBlurTextStyle(ev)"
                />
              </div>
              <div class="text-style-detail-item">
                <span class="detail-label">文字颜色：</span>
                <el-color-picker v-model="textStyle.color" color-format="hex" @change="val => handleChangeTextColor(val as string)" />
              </div>
            </div>
            <!-- 节点 -->
            <div v-show="isShowNodeStyle" class="node-style-box">
              <h4 class="operate-style-title">样式</h4>
              <h5 class="operate-style-module-title">位置</h5>
              <div class="node-style-detail-item">
                <span class="detail-label">x轴位置：</span>
                <el-input-number
                  v-model.number="nodeStyle.x"
                  step-strictly
                  :controls="false"
                  @change="val => handleChangeNodeX(val as number)"
                  @blur="ev => handleBlurNodeStyle(ev, 'x')"
                />
              </div>
              <div class="node-style-detail-item">
                <span class="detail-label">y轴位置：</span>
                <el-input-number
                  v-model.number="nodeStyle.y"
                  step-strictly
                  :controls="false"
                  @change="val => handleChangeNodeY(val as number)"
                  @blur="ev => handleBlurNodeStyle(ev, 'y')"
                />
              </div>
              <div class="node-style-detail-item">
                <span class="detail-label">旋转度数：</span>
                <el-input-number
                  v-model.number="nodeStyle.angle"
                  step-strictly
                  :controls="false"
                  @change="val => handleChangeNodeAngle(val as number)"
                  @blur="ev => handleBlurNodeStyle(ev, 'angle')"
                />
              </div>
            </div>
            <!-- 边 箭头 -->
            <div v-show="isShowEdgeStyle" class="edge-style-box">
              <h4 class="operate-style-title">样式</h4>
              <h5 class="operate-style-module-title">连线</h5>
              <div class="edge-style-detail-item">
                <span class="detail-label">连线类型：</span>
                <el-select v-model="edgeStyle.lineType" @change="handleChangeLineType" popper-class="center-select">
                  <el-option
                    v-for="item in lineTypeList"
                    :key="item.value"
                    :label="item.name"
                    :value="item.value"
                  />
                </el-select>
              </div>
              <div class="edge-style-detail-item">
                <span class="detail-label">连线颜色：</span>
                <el-color-picker v-model="edgeStyle.color" color-format="hex" @change="val => handleChangeLineColor(val as string)" />
              </div>
              <h5 class="operate-style-module-title">箭头</h5>
              <div class="edge-style-detail-item">
                <span class="detail-label">箭头样式：</span>
                <el-select v-model="edgeStyle.arrowType" @change="handleChangeArrowType" popper-class="center-select">
                  <el-option
                    v-for="item in arrowTypeList"
                    :key="item.value"
                    :label="item.name"
                    :value="item.value"
                  />
                </el-select>
              </div>
              <div class="edge-style-detail-item">
                <span class="detail-label">箭头宽度：</span>
                <el-slider v-model="edgeStyle.arrowWidth" :min="1" :max="50" @change="val => handleChangeArrowWidth(val as number)" />
              </div>
              <div class="edge-style-detail-item">
                <span class="detail-label">箭头长度：</span>
                <el-slider v-model="edgeStyle.arrowHeight" :min="1" :max="50" @change="val => handleChangeArrowHeight(val as number)" />
              </div>
            </div>
          </div>
          <div class="connection-detail-wrapper-box" v-show="!isEdit && viewNode">
            <connection-form
              ref="connectionFormRef"
              v-model:edit-type="connectionEditType"
              v-model:detail-loading="connectionDetailLoading"
              :current="current"
              :is-toggle="true"
              @handleRefreshList="handleRefresh"
            />
          </div>
        </div>
      </el-main>
    </el-container>
  </el-dialog>
</template>

<script lang="ts" setup>
import {
  Graph, Shape, Edge, Node, type JSONObject,
} from '@antv/x6';
import { Stencil } from '@antv/x6-plugin-stencil';
import { Snapline } from '@antv/x6-plugin-snapline';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { History } from '@antv/x6-plugin-history';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Transform } from '@antv/x6-plugin-transform';
import { Selection } from '@antv/x6-plugin-selection';
import { Scroller } from '@antv/x6-plugin-scroller';
import { Export } from '@antv/x6-plugin-export';
import { register, getTeleport } from '@antv/x6-vue-shape';
import html2canvas from 'html2canvas';
import { ConnectionApi } from '@/api';
import CustomVueNode from './flow-graph/custom-vue-node.vue';
import ContextMenu from './flow-graph/context-menu.vue';
import ConnectionForm from './connection/connection-form.vue';

const props = defineProps<{
  visible: boolean;
  isToggle?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleClose', id?: number): void;
}>();

const lineTypeList = [
  { name: '直线连接', value: 'normal' },
  { name: '圆弧连接', value: 'rounded' },
  { name: '流动连接', value: 'dashed' },
];

const arrowTypeList = [
  { name: '实心箭头', value: 'block' },
  { name: '经典箭头', value: 'classic' },
  { name: '菱形箭头', value: 'diamond' },
];

const TeleportContainer = getTeleport();
const dialogVisible = useVModel(props, 'visible', emit);
const stencilContainerRef = ref<HTMLElement | null>(null);
const graphContainerRef = ref<HTMLElement | null>(null);
const graph = ref<Graph>();
const stencil = ref<Stencil>();
const standAloneList = ref<Connection.ConnectionItem[]>([]);
const doubleLiveList = ref<Connection.ConnectionItem[]>([]);
const clusterList = ref<Connection.ConnectionItem[]>([]);
const listLoading = ref(false);
const isShowTextStyle = ref(false);
const textStyle = reactive({
  fontSize: 14,
  color: '#495AD4',
});
const isShowNodeStyle = ref(false);
const currentNode = ref();
const nodeStyle = reactive({
  x: 0,
  y: 0,
  angle: 0,
});
const isShowEdgeStyle = ref(false);
const currentEdge = ref();
const edgeStyle = reactive({
  lineType: 'normal',
  color: '#495AD4',
  arrowType: 'block',
  arrowWidth: 10,
  arrowHeight: 10,
});
const operateNode = ref();
const operateEdge = ref();
const isShowContextMenu = ref(false);
const contextMenuRef = ref<InstanceType<typeof ContextMenu>>();
const contextMenuTimer = ref();
const editType = ref<'view' | 'edit'>('view');
const viewNode = ref();
const connectionEditType = ref('edit');
const connectionFormRef = ref<InstanceType<typeof ConnectionForm>>();
const connectionDetailLoading = ref(false);
const current = ref<string | number>('');
const saveLoading = ref(false);
const graphLoading = ref(false);

// const maxHeight = computed(() => window.innerHeight - 100);
const isEdit = computed(() => editType.value === 'edit');

const { requestFn: getConnectionList } = useRequest(ConnectionApi.getConnectionList);
const { requestFn: getRelationalGraph } = useRequest(ConnectionApi.getRelationalGraph);
const { requestFn: saveRelationalGraph } = useRequest(ConnectionApi.saveRelationalGraph);

async function handleClose() {
  if (viewNode.value && connectionFormRef.value?.isCanSave) {
    const flag = await connectionFormRef.value?.handleChangeConnection();
    if (!flag) return;
  }
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
          stroke: '#495AD4',
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
          stroke: '#495AD4',
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
          stroke: '#495AD4',
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
          stroke: '#495AD4',
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
  width: 72,
  height: 92,
  x: 0,
  y: 0,
  ports: { ...ports },
});

Graph.registerNode(
  'custom-rect',
  {
    inherit: 'rect',
    width: 100,
    height: 30,
    attrs: {
      body: {
        // stroke: '#fff',
        strokeWidth: 0,
        fill: '#fff',
      },
      text: {
        fontSize: 14,
        fill: '#495AD4',
      },
    },
    ports: {
      groups: ports.groups,
      items: [
        {
          group: 'top',
        },
        {
          group: 'right',
          args: {
            x: '100%',
            y: '50%',
          },
        },
        {
          group: 'bottom',
          args: {
            x: '50%',
            y: '100%',
          },
        },
        {
          group: 'left',
          args: {
            x: 0,
            y: '50%',
          },
        },
      ],
    },
    tools: [
      {
        name: 'node-editor',
        args: {
          attrs: {
            backgroundColor: '#EFF4FF',
            fontSize: 14,
            color: '#495AD4',
          },
        },
      },
    ],
  },
  true,
);

function initialGraph(isDisabled?: boolean) {
  if (graph.value) {
    graph.value.dispose();
  }
  // #region 初始化画布
  graph.value = new Graph({
    container: graphContainerRef.value!,
    interacting: !isDisabled,
    grid: {
      visible: !isDisabled,
      type: 'dot',
      args: {
        color: '#dfe1ed',
        thickness: 1,
      },
    },
    background: {
      color: '#fff',
    },
    autoResize: true,
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
        name: 'normal',
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
              stroke: '#495AD4',
              strokeWidth: 2,
              strokeDasharray: 'none',
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
              },
              style: {
                animation: 'none',
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
            fill: '#495AD4',
            stroke: '#495AD4',
          },
        },
      },
    },
  });

  // #region 使用插件
  graph.value
    .use(new Snapline())
    .use(new Clipboard({
      enabled: !isDisabled,
    }))
    .use(new History({
      enabled: !isDisabled,
    }))
    .use(new Keyboard({
      enabled: !isDisabled,
    }))
    .use(new Selection({
      enabled: !isDisabled,
    }))
    .use(new Transform({
      resizing: {
        enabled: !isDisabled,
        preserveAspectRatio: true,
      },
      rotating: false,
    }))
    .use(new Scroller({
      enabled: true,
      pannable: true,
    }))
    .use(new Export());

  // graph.value.centerContent();

  // #region 初始化 stencil
  if (!isDisabled) {
    stencil.value = new Stencil({
      title: '流程图',
      target: graph.value,
      stencilGraphWidth: 268,
      stencilGraphHeight: 0,
      stencilGraphPadding: 0,
      collapsable: false,
      groups: [
        {
          title: '基础图形',
          name: 'group1',
          collapsed: false,
          layoutOptions: {
            columns: 1,
            columnWidth: 110,
            rowHeight: 42,
            center: false,
            resizeToFit: false,
            marginX: 10,
            marginY: 12,
            dx: 0,
            dy: 0,
          },
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
        columnWidth: 84,
        rowHeight: 104,
        center: false,
        resizeToFit: false,
        marginX: 12,
        marginY: 12,
        dx: 0,
        dy: 0,
      },
    });

    stencilContainerRef.value!.appendChild(stencil.value.container);
  }
}

// 状态变更重置操作
function resetState() {
  isShowTextStyle.value = false;
  isShowNodeStyle.value = false;
  isShowEdgeStyle.value = false;
  isShowContextMenu.value = false;
}

// 控制连接桩显示/隐藏
const showPorts = (portList: NodeListOf<SVGElement>, show: boolean) => {
  for (let i = 0, len = portList.length; i < len; i += 1) {
    portList[i].style.visibility = show ? 'visible' : 'hidden';
  }
};

function getEdgeStyle(edge: Edge) {
  isShowTextStyle.value = false;
  isShowNodeStyle.value = false;
  isShowEdgeStyle.value = true;
  currentEdge.value = edge;
  const style = edge.attr().line.style as JSONObject;
  const targetMarker = edge.attr().line.targetMarker as JSONObject;
  if (!edge.getConnector()) {
    edgeStyle.lineType = 'normal';
  } else if (edge.getConnector().name === 'rounded' && style.animation === 'none') {
    edgeStyle.lineType = 'rounded';
  } else if (edge.getConnector().name === 'normal' && style.animation !== 'none') {
    edgeStyle.lineType = 'dashed';
  } else {
    edgeStyle.lineType = 'normal';
  }
  edgeStyle.color = edge.attr().line.stroke as string || '#495AD4';
  edgeStyle.arrowType = targetMarker.name as string || 'block';
  edgeStyle.arrowWidth = targetMarker.height as number || 12;
  edgeStyle.arrowHeight = targetMarker.width as number || 8;
}

function getNodeStyle(node: Node) {
  isShowEdgeStyle.value = false;
  currentNode.value = node;
  if (node.prop().shape === 'custom-rect') {
    // 文本输入
    isShowTextStyle.value = true;
    isShowNodeStyle.value = false;
    textStyle.fontSize = node.attrs!.text.fontSize as number || 14;
    textStyle.color = node.attrs!.text.fill as string || '#495AD4';
  } else {
    isShowTextStyle.value = false;
    isShowNodeStyle.value = true;
    nodeStyle.x = node.position().x;
    nodeStyle.y = node.position().y;
    nodeStyle.angle = node.getAngle();
  }
}

// 事件监听
function graphWatchEvent() {
  graph.value?.on('node:mouseenter', () => {
    if (!isEdit.value) return;
    const container = document.getElementById('graph-container')!;
    const allPorts = container.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>;
    showPorts(allPorts, true);
  });
  graph.value?.on('node:mouseleave', () => {
    if (!isEdit.value) return;
    const container = document.getElementById('graph-container')!;
    const allPorts = container.querySelectorAll(
      '.x6-port-body',
    ) as NodeListOf<SVGElement>;
    showPorts(allPorts, false);
  });
  // 添加边
  graph.value?.on('edge:added', ({ edge }) => {
    if (!isEdit.value) return;
    getEdgeStyle(edge);
  });
  // 边单击
  graph.value?.on('edge:click', ({ edge }) => {
    if (!isEdit.value) return;
    getEdgeStyle(edge);
  });
  // 删除边
  graph.value?.on('edge:removed', ({ edge }) => {
    if (isShowEdgeStyle.value && edge.id === currentEdge.value.id) {
      isShowEdgeStyle.value = false;
      currentEdge.value = undefined;
    }
  });
  // 调整节点大小后触发
  graph.value?.on('node:resized', ({ node }) => {
    if (!isEdit.value) return;
    getNodeStyle(node);
    if (node.prop().shape === 'custom-vue-node') {
      // 高度=总高度减文字高度和间距
      // 宽度=总宽度
      // 二者取更小的那一个
      const height = node.size().height - 20;
      const { width } = node.size();
      node.setData({
        iconSize: Math.ceil(Math.min(width, height)),
      });
    }
  });
  // 鼠标抬起
  graph.value?.on('node:mouseup', ({ node }) => {
    if (!isEdit.value) return;
    getNodeStyle(node);
  });
  // 放置到画布上节点
  graph.value?.on('node:added', ({ node }) => {
    if (!isEdit.value) return;
    getNodeStyle(node);
  });
  // 节点单击
  graph.value?.on('node:click', async ({ node }) => {
    if (isEdit.value) {
      getNodeStyle(node);
    } else if (node.prop().shape === 'custom-rect') { // view 状态事件监听
      // 文本输入不做处理
    } else if (!viewNode.value) {
      viewNode.value = node;
      current.value = +node.data.id;
      connectionFormRef.value?.getDetail(current.value);
    } else {
      if (current.value === +node.data.id) return;
      if (connectionFormRef.value?.isCanSave) {
        const flag = await connectionFormRef.value?.handleChangeConnection();
        if (!flag) return;
      }
      viewNode.value = node;
      current.value = +node.data.id;
      connectionFormRef.value?.getDetail(current.value);
    }
  });
  // 节点删除
  graph.value?.on('node:removed', ({ node }) => {
    if (!isEdit.value) return;
    if (isShowTextStyle.value && node.prop().shape === 'custom-rect' && currentNode.value && +currentNode.value.data.id === +node.data.id) {
      isShowTextStyle.value = false;
      currentNode.value = undefined;
    }
    if (isShowNodeStyle.value && node.prop().shape === 'custom-vue-node' && currentNode.value && +currentNode.value.data.id === +node.data.id) {
      isShowNodeStyle.value = false;
      currentNode.value = undefined;
    }
  });
  // 画布单击
  graph.value?.on('blank:click', () => {
    if (isEdit.value) {
      resetState();
    } else {
      viewNode.value = undefined;
    }
  });
  // 画布右击
  graph.value?.on('blank:contextmenu', ({ e }) => {
    if (!isEdit.value) return;
    if (contextMenuTimer.value) {
      clearTimeout(contextMenuTimer.value);
      contextMenuTimer.value = undefined;
    }
    isShowContextMenu.value = true;
    if (graph.value && graph.value.getSelectedCells().length > 0) {
      const [cell] = graph.value!.getSelectedCells();
      if (cell.shape === 'edge') {
        operateEdge.value = cell;
      } else {
        operateNode.value = cell;
      }
    } else {
      operateNode.value = undefined;
      operateEdge.value = undefined;
    }
    contextMenuRef.value!.$el.style.inset = `${e.clientY - 100}px auto auto ${e.clientX}px`;
  });
  // 节点右击
  graph.value?.on('node:contextmenu', ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    e, x, y, node, view,
  }) => {
    if (!isEdit.value) return;
    if (contextMenuTimer.value) {
      clearTimeout(contextMenuTimer.value);
      contextMenuTimer.value = undefined;
    }
    isShowContextMenu.value = true;
    operateNode.value = node;
    contextMenuRef.value!.$el.style.inset = `${e.clientY - 100}px auto auto ${e.clientX}px`;
  });
  // 边右击
  graph.value?.on('edge:contextmenu', ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    e, x, y, view, edge,
  }) => {
    if (!isEdit.value) return;
    if (contextMenuTimer.value) {
      clearTimeout(contextMenuTimer.value);
      contextMenuTimer.value = undefined;
    }
    isShowContextMenu.value = true;
    operateEdge.value = edge;
    contextMenuRef.value!.$el.style.inset = `${e.clientY - 100}px auto auto ${e.clientX}px`;
  });
}

// #region 快捷键与事件
function graphBindEvent() {
  graph.value?.bindKey(['command+c', 'ctrl+c'], () => {
    const cells = graph.value?.getSelectedCells() || [];
    if (cells.length) {
      graph.value?.copy(cells, { deep: false, useLocalStorage: false });
      ElMessage.success({ message: '复制成功', grouping: true });
    } else {
      ElMessage.info({ message: '请先选中节点再复制', grouping: true });
    }
    return false;
  });
  graph.value?.bindKey(['command+v', 'ctrl+v'], () => {
    if (!graph.value?.isClipboardEmpty()) {
      graph.value?.paste({ offset: 32 });
      // graph.value?.cleanClipboard();
      ElMessage.success({ message: '粘贴成功', grouping: true });
    } else {
      ElMessage.info({ message: '剪切板为空，不可粘贴', grouping: true });
    }
    return false;
  });

  // undo redo
  graph.value?.bindKey(['command+z', 'ctrl+z'], () => {
    if (graph.value?.canUndo()) {
      graph.value?.undo();
    } else {
      ElMessage.info({ message: '没有需要撤销的操作', grouping: true });
    }
    return false;
  });
  graph.value?.bindKey(['command+shift+z', 'ctrl+y'], () => {
    if (graph.value?.canRedo()) {
      graph.value?.redo();
    } else {
      ElMessage.info({ message: '没有需要恢复的操作', grouping: true });
    }
    return false;
  });

  // delete
  graph.value?.bindKey(['backspace', 'delete'], () => {
    const cells = graph.value?.getSelectedCells() || [];
    if (cells.length) {
      graph.value?.removeCells(cells);
      ElMessage.success({ message: '删除成功', grouping: true });
    } else {
      ElMessage.info({ message: '请先选中节点再删除', grouping: true });
    }
    return false;
  });
}

function getList() {
  // 获取实例列表
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
  }).finally(() => {
    listLoading.value = false;
  });
}

function loadStencil() {
  const baseNode = graph.value!.createNode({
    shape: 'custom-rect',
    label: '文字输入',
  });
  const standAloneNodes = standAloneList.value.map((item) => graph.value!.createNode({
    shape: 'custom-vue-node',
    id: `${item.id}`,
    data: {
      text: item.name,
      type: 0,
      id: `${item.id}`,
      iconSize: 72,
    },
  }));
  const clusterNodes = clusterList.value.map((item) => graph.value!.createNode({
    shape: 'custom-vue-node',
    id: `${item.id}`,
    data: {
      text: item.name,
      type: 1,
      id: `${item.id}`,
      iconSize: 72,
    },
  }));
  const doubleLiveNodes = doubleLiveList.value.map((item) => graph.value!.createNode({
    shape: 'custom-vue-node',
    id: `${item.id}`,
    data: {
      text: item.name,
      type: 2,
      id: `${item.id}`,
      iconSize: 72,
    },
  }));
  stencil.value?.load([baseNode], 'group1');
  stencil.value?.load(standAloneNodes, 'group2');
  stencil.value?.load(clusterNodes, 'group3');
  stencil.value?.load(doubleLiveNodes, 'group4');
}

// #text 样式开始
function handleChangeTextFontSize(val: number) {
  currentNode.value.attr('text/fontSize', val);
}

function handleChangeTextColor(val: string) {
  currentNode.value.attr('text/fill', val);
}

function handleBlurTextStyle(ev: FocusEvent) {
  const val = (ev?.target as unknown as { value: string | number | null | undefined })?.value || '';
  if (!val) {
    nextTick(() => {
      textStyle.fontSize = 14;
      currentNode.value.attr('text/fontSize', 14);
    });
  }
}
// #endtext

// #node 样式开始
function handleChangeNodeX(val: number) {
  currentNode.value.prop('position', { x: val, y: currentNode.value.position().y });
}

function handleChangeNodeY(val: number) {
  currentNode.value.prop('position', { x: currentNode.value.position().x, y: val });
}

function handleChangeNodeAngle(val: number) {
  currentNode.value.prop('angle', val);
}

function handleBlurNodeStyle(ev: FocusEvent, key: 'x' | 'y' | 'angle') {
  const val = (ev?.target as unknown as { value: string | number | null | undefined })?.value || '';
  if (!val) {
    nextTick(() => {
      if (key === 'x') {
        nodeStyle.x = currentNode.value.position().x;
      } else if (key === 'y') {
        nodeStyle.y = currentNode.value.position().y;
      } else {
        nodeStyle.angle = currentNode.value.angle();
      }
    });
  }
}
// #endnode

// #line 样式开始
function handleChangeLineType(val: string) {
  if (val === 'dashed') {
    currentEdge.value.setConnector('normal');
    currentEdge.value.attr('line', {
      ...currentEdge.value.attr().line,
      strokeDasharray: 5,
      style: {
        animation: 'ant-line 30s infinite linear',
      },
    });
  } else if (val === 'rounded') {
    currentEdge.value.setConnector('rounded', { args: 20 });
    currentEdge.value.attr('line', {
      ...currentEdge.value.attr().line,
      strokeDasharray: 'none',
      style: {
        animation: 'none',
      },
    });
  } else {
    currentEdge.value.setConnector('normal');
    currentEdge.value.attr('line', {
      ...currentEdge.value.attr().line,
      strokeDasharray: 'none',
      style: {
        animation: 'none',
      },
    });
  }
}

function handleChangeLineColor(val: string) {
  currentEdge.value.attr('line', {
    ...currentEdge.value.attr().line,
    stroke: val,
  });
}
// #endline

// #arrow 样式开始
function handleChangeArrowType(val: string) {
  currentEdge.value.attr('line', {
    ...currentEdge.value.attr().line,
    targetMarker: {
      name: val,
      width: currentEdge.value.attr().line.targetMarker!.width,
      height: currentEdge.value.attr().line.targetMarker!.height,
    },
  });
}

// 箭头理解偏差，反向取值
function handleChangeArrowWidth(val: number) {
  currentEdge.value.attr('line', {
    ...currentEdge.value.attr().line,
    targetMarker: {
      name: currentEdge.value.attr().line.targetMarker!.name,
      width: currentEdge.value.attr().line.targetMarker!.width,
      height: val,
    },
  });
}

// 箭头理解偏差，反向取值
function handleChangeArrowHeight(val: number) {
  currentEdge.value.attr('line', {
    ...currentEdge.value.attr().line,
    targetMarker: {
      name: currentEdge.value.attr().line.targetMarker!.name,
      height: currentEdge.value.attr().line.targetMarker!.height,
      width: val,
    },
  });
}
// #endarrow

function onMouseDown() {
  contextMenuTimer.value = setTimeout(() => {
    isShowContextMenu.value = false;
    operateNode.value = undefined;
    operateEdge.value = undefined;
  }, 200);
}

// 右键操作
function handleClickOperate(key: string) {
  // 复制
  if (key === 'copy') {
    if (!operateNode.value) {
      ElMessage.info({ message: '请先选中节点再复制', grouping: true });
    } else {
      graph.value!.copy([operateNode.value], { deep: false, useLocalStorage: false });
      ElMessage.success({ message: '复制成功', grouping: true });
    }
  }
  // 粘贴
  if (key === 'paste') {
    if (graph.value!.isClipboardEmpty()) {
      ElMessage.info({ message: '剪切板为空，不可粘贴', grouping: true });
    } else {
      graph.value!.paste({ offset: 32 });
      // graph.value!.cleanClipboard();
      ElMessage.success({ message: '粘贴成功', grouping: true });
    }
  }
  // 撤销
  if (key === 'undo') {
    if (graph.value!.canUndo()) {
      graph.value!.undo();
    } else {
      ElMessage.info({ message: '没有需要撤销的操作', grouping: true });
    }
  }
  // 恢复
  if (key === 'redo') {
    if (graph.value!.canRedo()) {
      graph.value!.redo();
    } else {
      ElMessage.info({ message: '没有需要恢复的操作', grouping: true });
    }
  }
  // 删除节点
  if (key === 'del') {
    if (!operateNode.value) {
      ElMessage.info({ message: '请先选中节点再删除', grouping: true });
    } else {
      operateNode.value.remove();
      ElMessage.success({ message: '删除成功', grouping: true });
    }
  }
  // 删除边
  if (key === 'delEdge') {
    if (!operateEdge.value) {
      ElMessage.info({ message: '请先选中边再删除', grouping: true });
    } else {
      operateEdge.value.remove();
      ElMessage.success({ message: '删除成功', grouping: true });
    }
  }
}

// 获取画布数据
function getGraphData() {
  graphLoading.value = true;
  getRelationalGraph().then((res) => {
    if (res.data.detail) {
      const data = JSON.parse(res.data.detail);
      graph.value?.fromJSON(data);
      graph.value?.zoomToFit({ padding: 20, maxScale: 1 });
    }
  }).finally(() => {
    graphLoading.value = false;
  });
}

// 保存至查看状态
function handleSaveView() {
  const data = graph.value!.toJSON();
  saveLoading.value = true;
  saveRelationalGraph(JSON.stringify(data)).then(() => {
    ElMessage.success('保存成功');
    initialGraph(true);
    graphWatchEvent();
    graphBindEvent();
    resetState();
    viewNode.value = undefined;
    editType.value = 'view';
    getGraphData();
  }).finally(() => {
    saveLoading.value = false;
  });
}

// 清空
function handleEmpty() {
  graph.value!.clearCells();
}

// 编辑态
async function handleEdit() {
  if (viewNode.value && connectionFormRef.value?.isCanSave) {
    const flag = await connectionFormRef.value?.handleChangeConnection();
    if (!flag) return;
  }
  viewNode.value = undefined;
  initialGraph(false);
  graphWatchEvent();
  graphBindEvent();
  resetState();
  editType.value = 'edit';
  getList().then(() => {
    loadStencil();
  });
  getGraphData();
}

function backingScale() {
  if (window.devicePixelRatio && window.devicePixelRatio > 1) {
    return window.devicePixelRatio;
  }
  return 1;
}

// 导出
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleExport() {
  if (viewNode.value && connectionFormRef.value?.isCanSave) {
    const flag = await connectionFormRef.value?.handleChangeConnection();
    if (!flag) return;
  }
  // graph.value!.exportPNG('chart', {
  //   copyStyles: true,
  //   width: graph.value!.size.options.width + 200,
  //   height: graph.value!.size.options.height + 200,
  //   padding: 100,
  //   quality: 1,
  // });
  const scaleBy = backingScale();
  const w = parseInt(`${graph.value!.size.options.width + 200}`, 10);
  const h = parseInt(`${graph.value!.size.options.height + 200}`, 10);
  const canvas = document.createElement('canvas');
  canvas.width = w * scaleBy;
  canvas.height = h * scaleBy;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const context = canvas.getContext('2d');
  context!.scale(1, 1);

  html2canvas(document.querySelector('.flow-graph-wrapper')!, {
    canvas,
    useCORS: true,
    // background: 'none',
    logging: false,
  })
    .then((res) => {
      const imgsrc = res.toDataURL('image/png', 1);
      const a = document.createElement('a');
      a.download = 'aaaa.png';
      a.href = imgsrc;
      a.click();
    })
    .catch((error) => {
      console.log(error);
    });
}

// 保存实例信息
function handleRefresh() {
  initialGraph(true);
  graphWatchEvent();
  graphBindEvent();
  resetState();
  getGraphData();
  editType.value = 'view';
  connectionFormRef.value?.getDetail(+current.value);
}

watch(
  () => isShowContextMenu.value,
  (newVal) => {
    if (newVal) {
      document.addEventListener('mousedown', onMouseDown);
    } else {
      document.removeEventListener('mousedown', onMouseDown);
    }
  },
);

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      listLoading.value = false;
      standAloneList.value = [];
      doubleLiveList.value = [];
      clusterList.value = [];
      isShowTextStyle.value = false;
      isShowNodeStyle.value = false;
      currentNode.value = undefined;
      isShowEdgeStyle.value = false;
      currentEdge.value = undefined;
      operateNode.value = undefined;
      operateEdge.value = undefined;
      isShowContextMenu.value = false;
      contextMenuTimer.value = undefined;
      editType.value = 'view';
      viewNode.value = undefined;
      saveLoading.value = false;
      graphLoading.value = false;
      nextTick(() => {
        initialGraph(true);
        graphWatchEvent();
        graphBindEvent();
        getGraphData();
      });
    } else {
      document.removeEventListener('mousedown', onMouseDown);
      graph.value?.dispose();
      graph.value?.off();
    }
  },
);
</script>

<style lang="scss" scoped>
.flow-graph-modal{
  background-color: #fff;
  border-radius: 6px;
}

.flow-graph-operate-header{
  display: flex;
  align-items: center;
  justify-content: space-between;

  .flow-graph-operate-left{
    display: flex;
    height: 36px;
    align-items: center;
    border-radius:2px;
    border: 1px solid #DFE1ED;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #656A85;
    box-sizing: border-box;

    .flow-graph-close-btn, .flow-graph-header-title{
      width: 75px;
      text-align: center;
    }

    .flow-graph-header-title{
      position: relative;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;

      &::before{
        position: absolute;
        content: '';
        display: block;
        width: 1px;
        height: 26px;
        top: 5px;
        left: 0;
        background-color: #DFE1ED;
      }
    }
  }

  .operate-buttons{
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    color: #656A85;

    .el-button + .el-button {
      margin-left: 24px;
    }
  }
}

.flow-graph-container{
  height: 100%;
  border: 1px solid #DFE1ED;
  box-sizing: border-box;
}

.flow-container{
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
}

.flow-stencil-wrapper{
  width: 268px;
  height: 100%;
  position: relative;
  border-right: 1px solid #DFE1ED;
  box-sizing: content-box;
}

:deep(.x6-widget-stencil-group-content) {
  max-height: 324px;
  overflow: hidden auto;
}

.flow-graph-wrapper{
  flex: 1;
  height: 100% !important;
  position: relative;
}

.flow-operate-wrapper{
  width: 292px;
  padding: 16px;
  box-sizing: border-box;
  border-left: 1px solid #DFE1ED;

  .operate-style-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
    margin: 0 0 24px;
  }

  .operate-style-module-title{
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #424561;
    padding: 0 0 6px;
    border-bottom: 1px solid #DFE1ED;
    margin: 0 0 8px;
  }
}

.text-style-box, .node-style-box, .edge-style-box{
  // padding: 10px 10px 10px 0;
}

.text-style-detail-item, .node-style-detail-item, .edge-style-detail-item{
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .detail-label{
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #424561;
    width: 84px;
  }

  :deep(.el-input-number), :deep(.el-select), :deep(.el-slider) {
    flex: 1;
  }
}

.connection-detail-wrapper{
  width: 500px;
  height: 100%;
  border-radius: 6px;
  border-left: 1px solid #DFE1ED;
  padding: 0;
  display: flex;
  flex-direction: column;
}
</style>

<style lang="scss">
.flow-graph-modal{
  .el-dialog__header{
    border-bottom: none !important;
    padding: 20px 0 0 !important;
  }

  .el-dialog__body{
    padding: 8px 16px 16px !important;
    height: calc(100% - 80px);
  }
}

.center-select{
  .el-select-dropdown__item{
    text-align: center;
  }
}

.x6-graph-scroller {
  // width: calc(100% - 400px) !important;
  flex: 1;
  height: 100% !important;
  position: relative;
}

.x6-widget-stencil{
  background-color: #fff;
}

.x6-widget-stencil-content{
  padding-top: 12px;
}

.x6-widget-stencil-group.collapsed{
  max-height: 19px;
}

.x6-widget-stencil-group > .x6-widget-stencil-group-title{
  background-color: #fff;
  font-size: 14px;
  line-height: 14px;
  font-weight: 700;
  color: #495AD4;
  height: 18px;
  display: flex;
  align-items: center;
}

.x6-widget-stencil-title{
  display: none;
}

.x6-widget-stencil-title:hover, .x6-widget-stencil-group > .x6-widget-stencil-group-title:hover{
  color: #495AD4;
}

.x6-widget-stencil.collapsable > .x6-widget-stencil-title, .x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title{
  padding-left: 24px;
}

.x6-widget-stencil.collapsable > .x6-widget-stencil-title::before, .x6-widget-stencil-group.collapsable > .x6-widget-stencil-group-title::before{
  background-image: url('@/assets/icons/arrow.svg');
  background-repeat: no-repeat;
  background-size: contain;
  opacity: 1 !important;
  width: 16px;
  height: 16px;
  left: 8px;
  top: 0;
}

.x6-widget-stencil.collapsable.collapsed > .x6-widget-stencil-title::before, .x6-widget-stencil-group.collapsable.collapsed > .x6-widget-stencil-group-title::before{
  background-image: url('@/assets/icons/arrow-right.svg');
}

.x6-widget-transform {
  margin: -1px 0 0 -1px;
  padding: 0;
  border: 1px solid #495AD4;
}

.over-flow>span{
  text-align: center;
  width: 100%;
}

@keyframes ant-line {
  to {
      stroke-dashoffset: -1000
  }
}
</style>
