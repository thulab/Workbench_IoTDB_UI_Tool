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
        <div class="chart-container-box" v-loading="dataLoading">
          <the-chart :option="realTreeOptions" :click-func="clickFunction" />
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

const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const initialTreeDepth = ref(1);
const treeData = ref<StorageDevice.ModelData[]>([]);

const { requestFn: getDataModelTree, loading: dataLoading } = useRequest(StorageApi.getDataModelTree);

const treeDataOptions = (children: StorageDevice.ModelData[], deep: number = 1) => ({
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
      right: '20%',
      roam: true,
      scaleLimit: {
        min: 0.5,
        max: 3,
      },
      data: [{
        node: 'root',
        newNodePath: 'root',
        nodeType: 'root',
        label: {
          show: true,
          backgroundColor: '#495AD4',
          borderRadius: 2,
          color: '#ffffff',
          fontSize: 12,
          padding: [8, 10, 8, 10],
        },
        children,
      }],
      expandAndCollapse: true,
      initialTreeDepth: deep,
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
          root: {
            backgroundColor: '#495AD4',
            borderRadius: 2,
            color: '#ffffff',
            // fontSize: 12,
            // padding: [8, 10, 8, 10],
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
          // } if (params.data.nodeType === 'root') {
          //   return `{root|${params.data.node}}`;
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

const realTreeOptions = computed(() => treeDataOptions(treeData.value, initialTreeDepth.value));

function handleDoc() {
  window.open('https://www.timecho.com/docs/zh/UserGuide/V1.2.x/Basic-Concept/Data-Model-and-Terminology.html');
}

function getModalTreeData() {
  getDataModelTree({
    ...pagination,
    nodePath: 'root',
  }).then((res) => {
    const data = res.data.list || [];
    if (res.data.hasNext) {
      data.push({
        node: '下一页',
        newNodePath: 'root',
        nodeType: 'next',
        pageNum: 1,
        pageSize: 10,
        hasNext: true,
      });
    }
    treeData.value = data;
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dealData(data: StorageDevice.ModelData[]) {
  for (let i = 0; i < data.length; i++) {
    data[i].collapsed = true;
    if (data[i].children?.length) {
      if (data[i].hasNext) {
        data[i].children?.push({
          node: '下一页',
          newNodePath: data[i].newNodePath,
          nodeType: 'next',
          pageNum: data[i].pageNum,
          pageSize: data[i].pageSize,
        });
      }
      if (data[i].pageNum !== 1) {
        data[i].children?.unshift({
          node: '上一页',
          newNodePath: data[i].newNodePath.substring(0, data[i].newNodePath.lastIndexOf(data[i].node)),
          nodeType: 'next',
          pageNum: data[i].pageNum,
          pageSize: data[i].pageSize,
        });
      }
    }
  }
}

let loading = false;
function clickFunction(params: { data: StorageDevice.ModelData }) {
  if (loading) return;
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
    nodePath: data.newNodePath,
  }).then((res) => {
    // res
    console.log(res);
  }).finally(() => {
    loading = false;
  });
}

// 刷新
function handleRefresh() {
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

.chart-container-box{
  width: 100%;
  height: 100%;
}
</style>
