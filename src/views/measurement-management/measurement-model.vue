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
        <div class="chart-container-box">
          <the-chart :option="treeDataOptions" />
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

const treeDataOptions = computed<ECOption>(() => ({
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DFE1ED',
    formatter: (params: Object) => {
      const { data } = params as unknown as { data: Record<string, string | boolean | number | any> };
      if (data.nodeType === 'database' || data.nodeType === 'internal') {
        return `<h4 style="font-size: 14px;line-height: 14px;font-weight: 400;color: #495AD4;margin-bottom: 12px;">${data.node}</h4><p style="display: inline-flex; align-items: center;font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;margin-right: 24px;"><el-icon size="24"><i-custom-device-num /></el-icon><span style="color: #131926;">设备数量：</span>${data.deviceCount || '-'}</p><p style="display: inline-flex; align-items: center;font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;"><el-icon size="24"><i-custom-measure-num /></el-icon><span style="color: #131926;">测点数量：</span>${data.timeseriesCount || '-'}</p>`;
      } if (data.nodeType === 'device' || data.nodeType === 'database_device') {
        return `<h4 style="font-size: 14px;line-height: 14px;font-weight: 400;color: #495AD4;margin-bottom: 12px;">${data.node}</h4><p style="display: inline-flex; align-items: center;font-size: 12px;line-height: 12px;font-weight: 400;color: #656A85;"><el-icon size="24"><i-custom-measure-num /></el-icon><span style="color: #131926;">测点数量：</span>${data.timeseriesCount || '-'}</p>`;
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
        children: [],
      }],
      expandAndCollapse: true,
      initialTreeDepth: 2,
      label: {
        position: 'bottom',
        color: '#424561',
        borderColor: '#495AD4',
        borderWidth: 1,
        borderRadius: 1,
        padding: [6, 8, 6, 8],
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
        },
        formatter: (params: any) => {
          if (params.data.nodeType === 'database') {
            return [
              '{database|}',
              `${params.data.node}`,
            ].join('\n');
          } if (params.data.nodeType === 'database_device') {
            return [
              '{database|}',
              '{device|}',
              `${params.data.node}`,
            ].join('\n');
          } if (params.data.nodeType === 'device') {
            return [
              '{device|}',
              `${params.data.node}`,
            ].join('\n');
          } if (params.data.nodeType === 'timeseries' && params.data.timeseriesType === 'BASE') {
            return [
              '{base|}',
              `${params.data.node}`,
            ].join('\n');
          } if (params.data.nodeType === 'timeseries' && params.data.timeseriesType === 'VIEW') {
            return [
              '{view|}',
              `${params.data.node}`,
            ].join('\n');
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
}));

function handleDoc() {
  window.open('https://www.timecho.com/docs/zh/UserGuide/V1.2.x/Basic-Concept/Data-Model-and-Terminology.html');
}

// 刷新
function handleRefresh() {}
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
