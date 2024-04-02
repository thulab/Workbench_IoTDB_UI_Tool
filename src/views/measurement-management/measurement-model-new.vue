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
          <el-button :disabled="!canReadWriteSchema" link @click="handleRefresh" id="measurement-tree-refresh" :class="!canReadWriteSchema ? '' : 'svg-button-hover-color'">
            <el-icon size="24"><i-custom-refresh /></el-icon>
          </el-button>
        </auth-tooltip>
      </div>
    </el-header>
    <el-main class="p-0">
      <el-scrollbar>
        <auth-container :is-auth="canReadWriteSchema" style="height: 100%">
          <div class="model-container" v-loading="initialLoading">
            <div class="chart-container-box">
              <cascader-panel ref="modelCascaderPanelRef" :props="modelCascaderProps">
                <template #default="{ node, data }">
                  <div class="flex-align-center cascader-node-box" :id="`cascader-node-box-${data.lebel}`" @click="handleClickNode(node, data)">
                    <el-icon v-if="listLoading && (data.nodeType === 'next' || data.nodeType === 'pre')" class="el-icon is-loading"><i-ep-loading /></el-icon>
                    {{ data?.label }}
                  </div>
                </template>
              </cascader-panel>
            </div>
          </div>
        </auth-container>
      </el-scrollbar>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import type { CascaderProps, CascaderOption } from 'element-plus';
import CascaderPanelNode from 'element-plus/lib/components/cascader-panel/src/node';
import { StorageApi } from '@/api';
import { useUserStore } from '@/stores';
import CascaderPanel from '@/components/cascader-panel/cascader-panel.vue';

const initialLoading = ref(false);
const listLoading = ref(false);
const modelCascaderPanelRef = ref<InstanceType<typeof CascaderPanel>>();
const { t } = useI18n();
const userStore = useUserStore();
const { canReadWriteSchema } = storeToRefs(userStore);

const { requestFn: getDataModelTree } = useRequest(StorageApi.getDataModelTree);
const { requestFn: getBatchLastValue } = useRequest(StorageApi.getBatchLastValue);

function handleDoc() {
  window.open('https://www.timecho.com/docs/zh/UserGuide/V1.2.x/Basic-Concept/Data-Model-and-Terminology.html');
}

// 处理数据详情结果
function getDataPagination(data: StorageDevice.GetModelRes) {
  if (data.list?.length) {
    const timeseriesList: string[] = [];
    const viewTypeList: string[] = [];
    data.list.forEach((item) => {
      item.label = item.node;
      item.value = item.nodePath;
      item.leaf = item.nodeType === 'timeseries';
      if (item.nodeType === 'timeseries') {
        timeseriesList.push(item.nodePath);
        viewTypeList.push(item.timeseriesType || 'BASE');
      }
      if (timeseriesList.length || viewTypeList.length) {
        getBatchLastValue(timeseriesList, viewTypeList).then((newRes) => {
          data.list.forEach((r, i) => {
            r.newValue = newRes.data.values[i];
            r.valueTime = newRes.data.timestamps[i];
          });
        });
      }
    });
    if (data.hasNext) {
      data.list?.push({
        label: t('common.nextPage'),
        node: t('common.nextPage'),
        value: `${data.nodePath!}.next`,
        nodePath: data.nodePath!,
        nodeType: 'next',
        pageNum: data.pageNum + 1,
        leaf: true,
      });
    }
    if (data.hasPre) {
      data.list?.unshift({
        label: t('common.previousPage'),
        node: t('common.previousPage'),
        value: `${data.nodePath!}.pre`,
        nodePath: data.nodePath!,
        nodeType: 'pre',
        pageNum: data.pageNum - 1 || 1,
        leaf: true,
      });
    }
  }
  return data;
}

const modelCascaderProps: CascaderProps = {
  lazy: true,
  checkStrictly: true,
  lazyLoad(node, resolve) {
    const { level, data } = node;
    if (level === 0) {
      const nodeList = [
        {
          label: 'root',
          node: 'root',
          value: 'root',
          nodePath: 'root',
          nodeType: 'root',
          leaf: false,
          pageNum: 1,
        },
      ];
      resolve(nodeList);
    } else {
      getDataModelTree({
        pageNum: 1,
        pageSize: 10,
        nodePath: level === 1 ? 'root' : (data!.nodePath as string),
      }).then((res) => {
        const resData = {
          ...res.data,
          nodePath: level === 1 ? 'root' : (data!.nodePath as string),
          pageNum: 1,
        };
        const nodeList = getDataPagination(resData).list;
        resolve(nodeList as unknown as CascaderOption[]);
      });
    }
  },
};

function handleClickNode(node: CascaderPanelNode, data: StorageDevice.ModelData) {
  if (listLoading.value) return;
  if (data.nodeType === 'pre' || data.nodeType === 'next') {
    const cb = modelCascaderPanelRef.value!.updateKeyChildren(node);
    listLoading.value = true;
    getDataModelTree({
      pageNum: data.pageNum,
      pageSize: 10,
      nodePath: data!.nodePath,
    })
      .then((res) => {
        const resData = {
          ...res.data,
          nodePath: data!.nodePath,
          pageNum: data.pageNum,
        };

        const nodeList = getDataPagination(resData).list;
        cb(nodeList as unknown as CascaderOption[]);
      })
      .finally(() => {
        listLoading.value = false;
      });
  }
}

// 刷新
function handleRefresh() {}

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

  :deep(.el-cascader-panel) {
    height: 100%;
    box-sizing: border-box;
  }

  :deep(.el-cascader-menu__wrap.el-scrollbar__wrap) {
    height: 100%;
  }

  :deep(.el-cascader-node__prefix) {
    display: none;
  }

  :deep(.el-cascader-node .el-radio) {
    display: none;
  }
}
</style>
