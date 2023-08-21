<template>
  <el-scrollbar>
    <el-container class="details-wrapper">
      <el-main class="p-16">
        <div style="display: flex; flex-direction: column; height: 100%;">
          <div class="module-box-wrapper m-b-16" v-loading="loading">
            <div class="module-title-wrapper">
              <h4 class="module-title">系统信息</h4>
              <p class="module-details">
                <span class="module-label-text">数据截止：</span>
                <span class="module-content-text m-r-16">{{ systemTime }}</span>
                <el-button link @click="() => handleRefreshSystem()" id="dashboard-system-refresh"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
              </p>
            </div>
            <ul class="system-info-list">
              <li class="system-info-item">
                <el-icon size="24"><i-custom-system-status /></el-icon>
                <span class="module-label-text">服务器状态(Running)：</span>
                <span class="module-content-text" v-if="!systemData.dataNodeRatio && !systemData.configNodeRatio">-</span>
                <span class="module-content-text" v-else>Datanode {{systemData.dataNodeRatio ? `${systemData.dataNodeRatio}个` : '-'}} Confignode {{ systemData.configNodeRatio ? `${systemData.configNodeRatio}个` : '-'}}</span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-active-status /></el-icon>
                <span class="module-label-text">是否激活：</span>
                <span class="module-content-text" :style="{ color: systemData.active ? '#44C795' : '#D43030' }">{{ systemData.active ? '是' : '否' }}</span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-time /></el-icon>
                <span class="module-label-text">激活到期：</span>
                <span class="module-content-text">{{ systemData.expirationTime || '-' }}</span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-storage-num /></el-icon>
                <span class="module-label-text">数据库数量：</span>
                <span class="module-content-text">{{ toThousands(systemData.databaseNum, '-') }}</span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-device-num /></el-icon>
                <span class="module-label-text">设备数量：</span>
                <span class="module-content-text">{{ toThousands(systemData.deviceNum, '-') }}</span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-measure-num /></el-icon>
                <span class="module-label-text">测点数量：</span>
                <span class="module-content-text">{{ toThousands(systemData.measurementNum, '-') }}</span>
              </li>
            </ul>

            <div class="table-box-wrapper">
              <el-table
                :data="tableData"
                ref="tableRef"
                v-loading="loading"
                style="width: 100%;"
                :max-height="260"
                tooltip-effect="light"
                :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
                :default-sort="{ prop: 'type', order: 'ascending' }"
                @sort-change="handleSortChange"
              >
                <el-table-column label="节点" prop="address" min-width="200" align="center" show-overflow-tooltip />
                <el-table-column label="类型" prop="type" sortable="custom" min-width="120" align="center" show-overflow-tooltip />
                <el-table-column label="状态" prop="status" sortable="custom" min-width="120" align="center" show-overflow-tooltip />
                <el-table-column label="版本" prop="version" min-width="90" align="center" show-overflow-tooltip />
                <el-table-column label="物理机" prop="physicalMachine" min-width="160" align="center" show-overflow-tooltip />
                <template #empty>
                  <div class="table-empty-wrapper">
                    <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                    <span class="data-empty-text">暂无数据</span>
                  </div>
                </template>
              </el-table>
            </div>
          </div>

          <div class="module-box-wrapper monitor-info-wrapper">
            <div class="module-title-wrapper">
              <h4 class="module-title">监控信息</h4>
              <p class="module-details">
                <span class="module-label-text">数据截止：</span>
                <span class="module-content-text m-r-16">{{ monitorTime }}</span>
                <el-button link @click="handleRefreshMonitor" id="dashboard-monitor-refresh"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
              </p>
            </div>

            <!--  v-if="tableData.length && enablePrometheus" -->
            <div>
              <div class="search-form-box">
                <span class="search-from-label">节点：</span>
                <el-select v-model="monitorNode" placeholder="全部" style="width: 256px;" @change="handleChangeNode" id="dashboard-monitor-select-node">
                  <el-option v-for="(item, index) in nodeList" :key="`${item.address}(${item.type})_${index}`" :value="item.nodeID" :label="item.address ? `${item.address}(${item.type})` : '全部'" />
                </el-select>
              </div>

              <monitor-datanode
                v-if="currentNodeType === 'datanode'"
                ref="monitorDatanodeRef"
                :node="monitorNode"
                :node-type="currentNodeType"
                @handleFetch="handleFetch"
              />
              <monitor-confignode
                v-else-if="currentNodeType === 'confignode'"
                ref="monitorConfignodeRef"
                :node="monitorNode"
                :node-type="currentNodeType"
                @handleFetch="handleFetch"
              />
              <monitor-all
                v-else
                ref="monitorAllRef"
                @handleFetch="handleFetch"
              />
            </div>

            <div v-if="false" class="table-empty-wrapper monitor-empty-box">
              <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
              <span class="data-empty-text">暂无数据</span>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </el-scrollbar>
</template>

<script lang="ts" setup>
import { assign, concat } from 'lodash-es';
import dayjs from 'dayjs';
import type { ElTable } from 'element-plus';
import { useUserStore } from '@/stores';
import { DashboardApi } from '@/api';
import { toThousands } from '@/utils/format';
import MonitorAll from './components/monitor-all.vue';
import MonitorDatanode from './components/monitor-datanode.vue';
import MonitorConfignode from './components/monitor-confignode.vue';

const userStore = useUserStore();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const enablePrometheus = computed(() => userStore.enablePrometheus);
const tableRef = ref<InstanceType<typeof ElTable>>();
const systemData = reactive<Dashboard.SystemData>({
  dataNodeRatio: '-',
  configNodeRatio: '-',
  active: false,
  expirationTime: '-',
  databaseNum: 0,
  deviceNum: 0,
  measurementNum: 0,
});
const searchFormData = reactive({
  orderBy: 'type',
  asc: 'asc',
});
const tableData = ref<Dashboard.NodeItem[]>([]);
const refreshInterval = ref();
const systemTime = ref();
const monitorTime = ref();
const monitorNode = ref('');
const nodeList = ref<Dashboard.NodeItem[]>([]);
const currentNodeType = ref('');
const monitorAllRef = ref<InstanceType<typeof MonitorAll>>();
const monitorDatanodeRef = ref<InstanceType<typeof MonitorDatanode>>();
const monitorConfignodeRef = ref<InstanceType<typeof MonitorConfignode>>();

const { requestFn: getSystemInfo, loading } = useRequest(DashboardApi.getSystemInfo);

function getMonitorData() {
  monitorTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  if (currentNodeType.value === 'datanode') {
    nextTick(() => {
      monitorDatanodeRef.value?.initialAssign();
      monitorDatanodeRef.value?.getInitial();
    });
  } else if (currentNodeType.value === 'confignode') {
    nextTick(() => {
      monitorConfignodeRef.value?.initialAssign();
      monitorConfignodeRef.value?.getInitial();
    });
  } else {
    nextTick(() => {
      monitorAllRef.value?.initialAssign();
      monitorAllRef.value?.getInitial();
    });
  }
}

function getSystemData() {
  systemTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return getSystemInfo(searchFormData.orderBy, searchFormData.asc).then((res) => {
    assign(systemData, res.data);
    tableData.value = res.data.nodes || [];
    nodeList.value = concat([{
      nodeID: '',
      address: '',
      type: '',
      status: '',
      version: '',
      physicalMachine: '',
    }], res.data.nodes ? [...res.data.nodes] : []);
    const flag = nodeList.value.some((s) => s.nodeID === monitorNode.value);
    if (!flag) {
      monitorNode.value = '';
      currentNodeType.value = '';
      clearTimeout(refreshInterval.value);
      getMonitorData();
    }
  });
}

function handleFetch() {
  clearTimeout(refreshInterval.value);
  refreshInterval.value = setTimeout(() => {
    getSystemData();
    getMonitorData();
  }, 30 * 1000);
}

// 刷新系统
function handleRefreshSystem() {
  clearTimeout(refreshInterval.value);
  getSystemData().then(() => {
    handleFetch();
  });
}

// 刷新监控
function handleRefreshMonitor() {
  clearTimeout(refreshInterval.value);
  getMonitorData();
}

function handleChangeNode(val: string) {
  if (!val) {
    currentNodeType.value = '';
  } else {
    const current = nodeList.value.find((f) => f.nodeID === val);
    if (current) {
      currentNodeType.value = current.type;
    } else {
      monitorNode.value = '';
      currentNodeType.value = '';
    }
  }
  handleRefreshMonitor();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleSortChange({ column, prop, order }:SortMethod<Alarm.QueryConfigResult>) {
  const lastOrderBy = searchFormData.orderBy;
  const lastAsc = searchFormData.asc;
  searchFormData.asc = order === 'ascending' ? 'asc' : 'desc';
  searchFormData.orderBy = prop;
  if (!order) {
    tableRef.value?.sort(lastOrderBy, lastAsc === 'asc' ? 'descending' : 'ascending');
  }
  handleRefreshSystem();
}

onMounted(() => {
  getSystemData().then(() => {
    getMonitorData();
  });
});

onUnmounted(() => {
  clearTimeout(refreshInterval.value);
});
</script>

<style lang="scss" scoped>
.module-box-wrapper{
  border-radius: 6px;
  background: #FFF;
  padding: 16px;
  box-sizing: border-box;
}

.module-title-wrapper{
  display: flex;
  justify-content: space-between;
  align-items: center;

  .module-title{
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495AD4;
  }
}

.module-label-text{
  font-size: 12px;
  font-weight: 400;
  line-height: 12px;
  color: #131926;
  margin-right: 4px;
}

.module-content-text{
  font-size: 12px;
  font-weight: 400;
  line-height: 12px;
  color: #656A85;
}

.system-info-list{
  display: flex;
  flex-wrap: wrap;

  .system-info-item{
    display: flex;
    align-items: center;
    margin: 12px 24px 12px 0;

    &:last-child{
      margin: 8px 0;
    }
  }
}

.table-box-wrapper{
  border-radius: 2px;
  background: #F7F8FC;
  padding: 8px;
}

.search-form-box{
  margin: 18px 0 6px;
  display: flex;
  align-items: center;

  .search-from-label{
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #424561;
    flex: 0 0 50px;
  }
}

:deep(.el-scrollbar__view){
  height: 100%;
}

.monitor-info-wrapper{
  // min-height: calc(100% - 400px);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.monitor-empty-box{
  flex: 1;
}
</style>
<style lang="scss">
@import './components/monitor-module';
</style>
