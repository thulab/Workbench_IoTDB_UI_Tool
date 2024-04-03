<template>
  <el-container class="page-container p-0">
    <el-header class="detail-title-box">
      <h4 class="detail-title-text">{{ t('measurement.databaseModel') }}</h4>
      <div class="operate-buttons">
        <el-tooltip placement="top-start" effect="light" trigger="hover" :content="t('measurement.databaseModelDoc')" popper-class="tooltip-box-width">
          <el-button link class="m-r-4" @click="handleDoc" id="measurement-tree-doc">
            <el-icon size="24"><i-custom-model-doc /></el-icon>
          </el-button>
        </el-tooltip>
        <auth-tooltip :is-disabled="canReadWriteSchema">
          <el-button :disabled="!canReadWriteSchema" link @click="handleRefresh" id="measurement-tree-refresh">
            <el-icon size="24"><i-custom-refresh /></el-icon>
          </el-button>
        </auth-tooltip>
      </div>
    </el-header>
    <el-main class="p-0">
      <el-scrollbar>
        <auth-container :is-auth="canReadWriteSchema" style="height: 100%">
          <div class="model-container" v-loading="initialLoading">
            <div v-if="treeData.children?.length === 0" class="table-empty-wrapper" style="height: 100%">
              <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
              <span class="data-empty-text">{{ t('common.noData') }}</span>
            </div>
            <div v-else class="chart-container-box" v-loading="dataLoading">
              <the-chart :option="realTreeOptions" :click-func="clickFunction" />
            </div>
          </div>
        </auth-container>
      </el-scrollbar>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { type ECOption } from '@/plugins/echarts-plugin';
import databaseIcon from '@/assets/icons/model-database.svg';
import deviceIcom from '@/assets/icons/model-device.svg';
import baseMeasurementIcom from '@/assets/icons/base-measurement.svg';
import viewMeasurementIcom from '@/assets/icons/view-measurement.svg';
import { StorageApi } from '@/api';
import { useUserStore } from '@/stores';

const treeData = ref<StorageDevice.ModelData>({
  node: 'root',
  nodePath: 'root',
  nodeType: 'root',
  pageNum: 1,
  pageSize: 10,
  children: [],
});
const initialLoading = ref(true);
const { t, locale } = useI18n();

const userStore = useUserStore();
const { canReadWriteSchema } = storeToRefs(userStore);

const { requestFn: getDataModelTree, loading: dataLoading } = useRequest(StorageApi.getDataModelTree);
const { requestFn: getBatchLastValue } = useRequest(StorageApi.getBatchLastValue);

const maxExpandLevel = ref(0);

const chartWidth = computed(() => {
  // 2级 200。3级 400 4级 600 以上100％
  if (maxExpandLevel.value < 1) {
    return 200;
  }
  if (maxExpandLevel.value === 1) {
    return 400;
  }
  if (maxExpandLevel.value === 2) {
    return 600;
  }
  return 'auto';
});

const treeDataOptions = (detailData: StorageDevice.ModelData, width: number | 'auto') =>
  ({
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
          return `<h4 style="font-size: 14px;line-height: 14px;font-weight: 400;color: #495AD4;margin-bottom: 12px;">${data.node}</h4><p style="display: inline-flex; align-items: center;font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;margin-right: 24px;"><el-icon size="24"><i-custom-device-num /></el-icon><span style="color: #131926;">${t('measurement.deviceNum')}：</span>${data.deviceCount || data.deviceCount === 0 ? data.deviceCount : '-'}</p><p style="display: inline-flex; align-items: center;font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;"><el-icon size="24"><i-custom-measure-num /></el-icon><span style="color: #131926;">${t('measurement.measurementNum')}：</span>${data.timeseriesCount || data.timeseriesCount === 0 ? data.timeseriesCount : '-'}</p>`;
        }
        if (data.nodeType === 'device' || data.nodeType === 'database_device') {
          return `<h4 style="font-size: 14px;line-height: 14px;font-weight: 400;color: #495AD4;margin-bottom: 12px;">${data.node}</h4><p style="display: inline-flex; align-items: center;font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;"><el-icon size="24"><i-custom-measure-num /></el-icon><span style="color: #131926;">${t('measurement.measurementNum')}：</span>${data.timeseriesCount || data.timeseriesCount === 0 ? data.timeseriesCount : '-'}</p>`;
        }
        if (data.nodeType === 'timeseries') {
          return `<h4 style="font-size: 14px;line-height: 14px;font-weight: 400;color: #495AD4;margin-bottom: 12px;">${data.node}</h4><p font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;margin-bottom: 16px;"><span style="color: #131926;">${t('measurement.dataType')}：</span>${data.dataType || '-'}</p><p font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;margin-bottom: 16px;"><span style="color: #131926;">${t('measurement.lastValue')}：</span>${data.value || '-'}</p><p font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;"><span style="color: #131926;">${t('measurement.lastValueTime')}：</span>${data.valueTime || '-'}</p>`;
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
        initialTreeDepth: 1,
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
            }
            if (params.data.nodeType === 'database_device') {
              return `{database|}{device|}{textSpace|${params.data.node}}`;
            }
            if (params.data.nodeType === 'device') {
              return `{device|}{textSpace|${params.data.node}}`;
            }
            if (params.data.nodeType === 'timeseries' && params.data.timeseriesType === 'BASE') {
              return `{base|}{textSpace|${params.data.node}}`;
            }
            if (params.data.nodeType === 'timeseries' && params.data.timeseriesType === 'VIEW') {
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
  }) as ECOption;

const realTreeOptions = computed(() => treeDataOptions(treeData.value, chartWidth.value));

function handleDoc() {
  if (locale.value === 'en') {
    window.open('https://www.timecho.com/docs/UserGuide/latest/Basic-Concept/Data-Model-and-Terminology.html');
  } else {
    window.open('https://www.timecho.com/docs/zh/UserGuide/latest/Basic-Concept/Data-Model-and-Terminology.html');
  }
}
// 获取数据模型树当前展开的最大层级, 如果大于 2 就直接返回 3，用于设定宽度

function getMaxExpandLevel(data: StorageDevice.ModelData, level = 0) {
  // 如果节点为叶子节点，返回当前层级
  if (!data.children || data.children.length === 0) {
    return level;
  }

  let maxLevel = level;
  // 遍历子节点
  for (let i = 0; i < data.children.length; i++) {
    const child = data.children[i];
    // 如果子节点是展开状态
    if (child.collapsed === false && child.children && child.children.length > 0) {
      // 递归获取子节点的最大展开层级
      const childLevel = getMaxExpandLevel(child, level + 1);
      // 更新最大层级
      maxLevel = Math.max(maxLevel, childLevel);
      if (maxLevel > 2) {
        return 3;
      }
    }
  }

  return maxLevel;
}

function getModalTreeData() {
  initialLoading.value = true;
  getDataModelTree({
    pageNum: 1,
    pageSize: 10,
    nodePath: 'root',
  })
    .then((res) => {
      const data = res.data.list || [];
      if (res.data.hasNext) {
        data.push({
          node: t('common.nextPage'),
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
    })
    .finally(() => {
      initialLoading.value = false;
    });
}

function dealData(data: StorageDevice.ModelData[]) {
  for (let i = 0; i < data.length; i++) {
    data[i].collapsed = true;
    if (data[i].children?.length) {
      if (data[i].hasNext) {
        data[i].children?.push({
          node: t('common.nextPage'),
          nodePath: data[i].nodePath,
          nodeType: 'next',
          pageNum: data[i].pageNum,
          pageSize: data[i].pageSize,
        });
      }
      if (data[i].hasPre) {
        data[i].children?.unshift({
          node: t('common.previousPage'),
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
      maxExpandLevel.value = getMaxExpandLevel(treeData.value, 0);
      return;
    }
    setCollapsed(params.data, false);
    maxExpandLevel.value = getMaxExpandLevel(treeData.value, 0);
    if (params.data.children && params.data.children.length !== 0) {
      return;
    }
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
  })
    .then((res) => {
      const list = res.data.list || [];
      const timeseriesList: string[] = [];
      const viewTypeList: string[] = [];
      list.forEach((item) => {
        item.collapsed = true;
        if (item.nodeType === 'timeseries') {
          timeseriesList.push(item.nodePath);
          viewTypeList.push(item.timeseriesType || 'BASE');
        }
      });
      if (timeseriesList.length || viewTypeList.length) {
        getBatchLastValue(timeseriesList, viewTypeList).then((newRes) => {
          data.children = list.map((r, i) => ({
            ...r,
            leafDeep: data.leafDeep!,
            value: newRes.data.values[i],
            valueTime: newRes.data.timestamps[i],
          }));
          data.pageNum = res.data.pageNum;
          data.pageSize = res.data.pageSize;
          data.hasNext = res.data.hasNext;
          data.hasPre = res.data.hasPre;
          dealData([data]);
          if (data.children?.length) {
            deepSearchSelf(treeData.value, data.nodePath, 1, { ...data });
          }
          maxExpandLevel.value = getMaxExpandLevel(treeData.value, 0);
        });
      } else {
        data.children = list.map((item) => ({ ...item, leafDeep: data.leafDeep ? data.leafDeep + 1 : 1 }));
        data.pageNum = res.data.pageNum;
        data.pageSize = res.data.pageSize;
        data.hasNext = res.data.hasNext;
        data.hasPre = res.data.hasPre;
        dealData([data]);
        if (data.children?.length) {
          deepSearchSelf(treeData.value, data.nodePath, 1, { ...data });
        }
        maxExpandLevel.value = getMaxExpandLevel(treeData.value, 0);
      }
    })
    .finally(() => {
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
  maxExpandLevel.value = 0;
  getModalTreeData();
}

onMounted(() => {
  if (!canReadWriteSchema.value) return;
  handleRefresh();
});

watch(
  () => canReadWriteSchema.value,
  (val) => {
    if (val) {
      handleRefresh();
    }
  },
  {
    immediate: true,
  }
);
</script>

<style lang="scss" scoped>
.detail-title-box {
  height: 41px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dfe1ed;
  padding: 0 16px;
  box-sizing: border-box;

  .detail-title-text {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
  }
}

:deep(.el-scrollbar__view) {
  height: 100%;
}

.model-container {
  width: 100%;
  height: 100%;
}

.chart-container-box {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
