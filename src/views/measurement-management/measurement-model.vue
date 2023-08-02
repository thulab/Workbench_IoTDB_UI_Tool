<template>
  <el-container class="page-container p-0">
    <el-header class="detail-title-box">
      <h4 class="detail-title-text">数据模型</h4>
      <div class="operate-buttons">
        <el-tooltip
          placement="top-start"
          effect="light"
          trigger="hover"
          content="iotdb树形模型指导文档"
          popper-class="tooltip-box-width"
        >
          <el-button link class="m-r-4" @click="handleDoc"><el-icon size="24"><i-custom-model-doc /></el-icon></el-button>
        </el-tooltip>
        <el-button link @click="handleRefresh"><el-icon size="24"><i-custom-refresh /></el-icon></el-button>
      </div>
    </el-header>
    <el-main class="p-0">
      <el-scrollbar>
        <div class="model-container" v-loading="initialLoading">
          <div v-if="treeData.children?.length === 0" class="table-empty-wrapper" style="height: 100%;">
            <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
            <span class="data-empty-text">暂无数据</span>
          </div>
          <div v-else class="chart-container-box" v-loading="dataLoading">
            <the-chart :option="realTreeOptions" :click-func="clickFunction" />
          </div>
        </div>
      </el-scrollbar>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { type ECOption } from '@/plugins/echarts-plugin';
import databaseIcon from '@/assets/icons/model-database.svg';
import deviceIcom from '@/assets/icons/model-device.svg';
import baseMeasurementIcom from '@/assets/icons/base-measurement.svg';
import viewMeasurementIcom from '@/assets/icons/view-measurement.svg';
import { StorageApi } from '@/api';

const treeData = ref<StorageDevice.ModelData>({
  node: 'root',
  nodePath: 'root',
  nodeType: 'root',
  pageNum: 1,
  pageSize: 10,
  children: [],
});
const initialLoading = ref(true);
const deepList = ref<number[]>([]);

const { requestFn: getDataModelTree, loading: dataLoading } = useRequest(StorageApi.getDataModelTree);
const { requestFn: getLastValue } = useRequest(StorageApi.getLastValue);

const initialTreeDepth = computed(() => {
  if (deepList.value.length === 0) {
    return 0;
  }
  const maxValue = deepList.value.reduce((max, cur) => {
    if (cur > max) { return cur; }
    return max;
  }, 0);
  return maxValue;
});

const chartWidth = computed(() => {
  // 2级 200。3级 400 4级 600 以上100％
  if (initialTreeDepth.value < 1) {
    return 200;
  }
  if (initialTreeDepth.value === 1) {
    return 400;
  } if (initialTreeDepth.value === 2) {
    return 600;
  }
  return 'auto';
});

const treeDataOptions = (detailData: StorageDevice.ModelData, width: number | string, deep: number = 1) => ({
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DFE1ED',
    formatter: (params: Object) => {
      const { data } = params as unknown as { data: StorageDevice.ModelData };
      if (data.nodeType === 'database' || data.nodeType === 'internal') {
        return `<h4 style="font-size: 14px;line-height: 14px;font-weight: 400;color: #495AD4;margin-bottom: 12px;">${data.node}</h4><p style="display: inline-flex; align-items: center;font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;margin-right: 24px;"><el-icon size="24"><i-custom-device-num /></el-icon><span style="color: #131926;">设备数量：</span>${(data.deviceCount || data.deviceCount === 0) ? data.deviceCount : '-'}</p><p style="display: inline-flex; align-items: center;font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;"><el-icon size="24"><i-custom-measure-num /></el-icon><span style="color: #131926;">测点数量：</span>${(data.timeseriesCount || data.timeseriesCount) ? data.timeseriesCount : '-'}</p>`;
      } if (data.nodeType === 'device' || data.nodeType === 'database_device') {
        return `<h4 style="font-size: 14px;line-height: 14px;font-weight: 400;color: #495AD4;margin-bottom: 12px;">${data.node}</h4><p style="display: inline-flex; align-items: center;font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;"><el-icon size="24"><i-custom-measure-num /></el-icon><span style="color: #131926;">测点数量：</span>${(data.timeseriesCount || data.timeseriesCount) ? data.timeseriesCount : '-'}</p>`;
      } if (data.nodeType === 'timeseries') {
        return `<h4 style="font-size: 14px;line-height: 14px;font-weight: 400;color: #495AD4;margin-bottom: 12px;">${data.node}</h4><p font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;margin-bottom: 16px;"><span style="color: #131926;">数据类型：</span>${data.dataType || '-'}</p><p font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;margin-bottom: 16px;"><span style="color: #131926;">最新值：</span>${data.value || '-'}</p><p font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;"><span style="color: #131926;">最新值时间：</span>${data.valueTime || '-'}</p>`;
      }
      return '';
    },
  },
  series: [
    {
      type: 'tree',
      symbol: 'emptyCircle',
      symbolSize: 0,
      top: '1%',
      left: '7%',
      bottom: '1%',
      right: '7%',
      roam: false,
      scaleLimit: {
        min: 0.5,
        max: 3,
      },
      data: [detailData],
      expandAndCollapse: true,
      initialTreeDepth: deep,
      width,
      label: {
        position: 'bottom',
        color: '#424561',
        fontSize: 12,
        lineHeight: 18,
        fontWeight: 400,
        backgroundColor: '#fff',
        borderColor: '#495AD4',
        borderWidth: 1,
        borderRadius: 1,
        padding: [2, 8, 2, 8],
        verticalAlign: 'middle',
        align: 'center',
        rich: {
          database: {
            backgroundColor: {
              image: databaseIcon,
            },
            width: 24,
            height: 24,
          },
          device: {
            backgroundColor: {
              image: deviceIcom,
            },
            width: 24,
            height: 24,
          },
          base: {
            backgroundColor: {
              image: baseMeasurementIcom,
            },
            width: 24,
            height: 24,
          },
          view: {
            backgroundColor: {
              image: viewMeasurementIcom,
            },
            width: 24,
            height: 24,
          },
          textSpace: {
            padding: [0, 0, 0, 8],
          },
        },
        formatter: (params: { data: StorageDevice.ModelData }) => {
          if (params.data.nodeType === 'database') {
            return `{database|}{textSpace|${params.data.node}}`;
          } if (params.data.nodeType === 'database_device') {
            return `{database|}{device|}{textSpace|${params.data.node}}`;
          } if (params.data.nodeType === 'device') {
            return `{device|}{textSpace|${params.data.node}}`;
          } if (params.data.nodeType === 'timeseries' && params.data.timeseriesType === 'BASE') {
            return `{base|}{textSpace|${params.data.node}}`;
          } if (params.data.nodeType === 'timeseries' && params.data.timeseriesType === 'VIEW') {
            return `{view|}{textSpace|${params.data.node}}`;
          }
          return `${params.data.node}`;
        },
      },
      leaves: {
        label: {
          position: 'bottom',
          verticalAlign: 'middle',
          align: 'center',
        },
      },
      lineStyle: {
        color: '#DFE1ED',
        width: 2,
      },
      animationDuration: 550,
      animationDurationUpdate: 750,
    },
  ],
} as ECOption);

const realTreeOptions = computed(() => treeDataOptions(treeData.value, chartWidth.value, 1));

function handleDoc() {
  window.open('https://www.timecho.com/docs/zh/UserGuide/V1.2.x/Basic-Concept/Data-Model-and-Terminology.html');
}

function getModalTreeData() {
  initialLoading.value = true;
  getDataModelTree({
    pageNum: 1,
    pageSize: 10,
    nodePath: 'root',
  }).then((res) => {
    const data = res.data.list || [];
    if (res.data.hasNext) {
      data.push({
        node: '下一页',
        nodePath: 'root',
        nodeType: 'next',
        pageNum: 1,
        pageSize: 10,
      });
    }
    treeData.value = {
      node: 'root',
      nodePath: 'root',
      nodeType: 'root',
      pageNum: 1,
      pageSize: 10,
      collapsed: false,
      label: {
        backgroundColor: '#495AD4',
        borderRadius: 2,
        color: '#ffffff',
        fontSize: 12,
        padding: [3, 10, 3, 10],
      },
      leafDeep: 0,
      children: data.map((item) => ({ ...item, collapsed: true, leafDeep: 1 })) || [],
    };
  }).finally(() => {
    initialLoading.value = false;
  });
}

function dealData(data: StorageDevice.ModelData[]) {
  for (let i = 0; i < data.length; i++) {
    data[i].collapsed = true;
    if (data[i].children?.length) {
      if (data[i].hasNext) {
        data[i].children?.push({
          node: '下一页',
          nodePath: data[i].nodePath,
          nodeType: 'next',
          pageNum: data[i].pageNum,
          pageSize: data[i].pageSize,
        });
      }
      if (data[i].hasPre) {
        data[i].children?.unshift({
          node: '上一页',
          nodePath: data[i].nodePath,
          nodeType: 'pre',
          pageNum: data[i].pageNum,
          pageSize: data[i].pageSize,
        });
      }
    }
  }
}

const deepSearchSelf = (data: StorageDevice.ModelData, path: string, index: number, levelData: StorageDevice.ModelData) => {
  if (data.nodePath === path) {
    data.collapsed = !levelData.collapsed;
    data.children = levelData.children || [];
    data.pageNum = levelData.pageNum;
    data.pageSize = levelData.pageSize;
    // initialTreeDepth.value = index;
  } else {
    index++;
    if (data.children && data.children.length) {
      for (let i = 0; i < data.children.length; i++) {
        deepSearchSelf(data.children[i], path, index, levelData);
      }
    }
  }
};

const pushDeepList = (depth: number) => {
  deepList.value.push(depth);
};

const removeDeepList = (depth: number) => {
  const i = deepList.value.findIndex((da) => da === depth);
  if (i !== -1) {
    deepList.value.splice(i, 1);
  }
};

const deepDepthSelf = (data: StorageDevice.ModelData[], topCollapsed: Boolean) => {
  data.forEach((item) => {
    if (item.children && item.children.length > 0) {
      if (!item.collapsed) {
        if (!topCollapsed) {
          pushDeepList(item.leafDeep!);
        } else {
          removeDeepList(item.leafDeep!);
        }
        if (item.children) {
          deepDepthSelf(item.children, topCollapsed);
        }
      }
    }
  });
};

async function getLast(deviceName: string, measurementName: string, viewType: string = 'BASE') {
  const data = {
    value: '',
    valueTime: '',
  };
  await getLastValue(deviceName, measurementName, viewType).then((newRes) => {
    data.value = newRes.data.value || '-';
    data.valueTime = newRes.data.valueTime || '-';
  });
  return data;
}

let loading = false;

const getItemByPath = (data: StorageDevice.ModelData, nodePath: string) => {
  let result = null;
  if (data.nodePath === nodePath) {
    result = data;
    return result;
  }
  if (data.children?.length) {
    data.children.forEach((item) => {
      const resultChild = getItemByPath(item, nodePath);
      if (resultChild) result = resultChild;
    });
  }
  return result;
};

const setCollapsed = (data: StorageDevice.ModelData, collapsed: boolean) => {
  data.collapsed = collapsed;
  const treeDataItem = getItemByPath(treeData?.value, data.nodePath);
  if (treeDataItem) treeDataItem.collapsed = collapsed;
};
function clickFunction(params: { data: StorageDevice.ModelData }) {
  if (loading) return;
  if (params.data.nodeType !== 'next' && params.data.nodeType !== 'pre') {
    if (params.data.nodeType === 'timeseries') return;
    if (!params.data.collapsed) {
      setCollapsed(params.data, true);
      removeDeepList(params.data.leafDeep || -1);
      deepDepthSelf(params.data.children || [], params.data.collapsed!);
      return;
    }
    setCollapsed(params.data, false);
    pushDeepList(params.data.leafDeep || -1);
    deepDepthSelf(params.data.children || [], params.data.collapsed!);
    if (params.data.children && params.data.children.length !== 0) { return; }
  }
  loading = true;
  const data = params.data || {};
  if (data.nodeType === 'next') {
    data.pageNum += 1;
  } else if (data.nodeType === 'pre' && data.pageNum >= 1) {
    data.pageNum -= 1;
  } else {
    data.pageNum = 1;
    data.pageSize = 10;
  }
  getDataModelTree({
    pageNum: data.pageNum,
    pageSize: data.pageSize,
    nodePath: data.nodePath,
  }).then((res) => {
    const list = res.data.list || [];
    const promiseQueue: Array<Promise<{
      value: string;
      valueTime: string;
    }>> = [];
    list.forEach((item) => {
      item.collapsed = true;
      if (item.nodeType === 'timeseries') {
        promiseQueue.push(getLast(data.nodePath, item.node, item.timeseriesType));
      }
    });
    if (promiseQueue.length) {
      Promise.allSettled(promiseQueue).then((results) => {
        data.children = list.map((r, i) => {
          if (results[i]?.status === 'fulfilled') {
            return {
              ...r, leafDeep: data.leafDeep!, value: results[i]?.value.value, valueTime: results[i]?.value.valueTime,
            };
          }
          return { ...r, leafDeep: data.leafDeep! };
        });
        data.pageNum = res.data.pageNum;
        data.pageSize = res.data.pageSize;
        data.hasNext = res.data.hasNext;
        data.hasPre = res.data.hasPre;
        dealData([data]);
        if (data.children?.length) {
          deepSearchSelf(treeData.value, data.nodePath, 1, { ...data });
        }
      });
    } else {
      data.children = list.map((item) => ({ ...item, leafDeep: data.leafDeep ? (data.leafDeep + 1) : 1 }));
      data.pageNum = res.data.pageNum;
      data.pageSize = res.data.pageSize;
      data.hasNext = res.data.hasNext;
      data.hasPre = res.data.hasPre;
      dealData([data]);
      if (data.children?.length) {
        deepSearchSelf(treeData.value, data.nodePath, 1, { ...data });
      }
    }
  }).finally(() => {
    loading = false;
  });
}

// 刷新
function handleRefresh() {
  treeData.value = {
    node: 'root',
    nodePath: 'root',
    nodeType: 'root',
    pageNum: 1,
    pageSize: 10,
    children: [],
  };
  // initialTreeDepth.value = 1;
  deepList.value = [];
  getModalTreeData();
}

onMounted(() => {
  handleRefresh();
});
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

:deep(.el-scrollbar__view){
  height: 100%;
}

.model-container{
  width: 100%;
  height: 100%;
}

.chart-container-box{
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
