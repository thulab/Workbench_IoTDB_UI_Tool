<template>
  <el-scrollbar>
    <el-container class="details-wrapper" style="height: 100%">
      <el-main class="p-16">
        <div style="display: flex; flex-direction: column; height: 100%" v-loading="loading">
          <div class="module-box-wrapper m-b-16" v-if="!canMaintain">
            <div class="module-title-wrapper">
              <h4 class="module-title">{{ t('dashboard.systemInfo') }}</h4>
            </div>
            <auth-container :is-auth="canMaintain" :content="'common.maintainAuth'" style="flex: 1" />
          </div>

          <div class="module-box-wrapper m-b-16" v-if="canMaintain">
            <div class="module-title-wrapper">
              <h4 class="module-title">{{ slaveData ? t('dashboard.masterSystemInfo') : t('dashboard.systemInfo') }}</h4>
              <p class="module-details">
                <span class="module-label-text">{{ `${t('dashboard.deadTime')}：` }}</span>
                <span class="module-content-text m-r-16">{{ systemTime }}</span>
                <el-button link @click="() => handleRefreshSystem()" id="dashboard-system-refresh" class="svg-button-hover-color"><i-custom-refresh style="width: 24px; height: 24px" /></el-button>
              </p>
            </div>
            <ul class="system-info-list">
              <li class="system-info-item">
                <el-icon size="24"><i-custom-system-status /></el-icon>
                <span class="module-label-text">{{ `${t('dashboard.serverStatus')}(Running)：` }}</span>
                <span class="module-content-text" v-if="!systemData.dataNodeRatio && !systemData.configNodeRatio">-</span>
                <span class="module-content-text" v-else>
                  ConfigNode {{ systemData.configNodeRatio ? `${systemData.configNodeRatio}${locale === 'en' ? '' : '个'}` : '-' }} DataNode
                  {{ systemData.dataNodeRatio ? `${systemData.dataNodeRatio}${locale === 'en' ? '' : '个'}` : '-' }}
                  AINode {{ systemData.aiNodeRatio ? `${systemData.aiNodeRatio}${locale === 'en' ? '' : '个'}` : '-' }}
                </span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-active-status /></el-icon>
                <span class="module-label-text">{{ t('dashboard.isActive') }}：</span>
                <span class="module-content-text" :style="{ color: systemData.active ? '#44C795' : '#D43030' }">{{ systemData.active ? t('common.yes') : t('common.no') }}</span>
                <el-button
                  v-if="systemData.active && showVersionCol1312(connectionStore.connectionInfo.currentVersion || '')"
                  type="primary"
                  link
                  class="m-l-8"
                  style="text-decoration: underline"
                  @click="handleClickActive(true)"
                  id="master-active-button"
                >
                  {{ t('dashboard.activeDetail') }}
                </el-button>
              </li>
              <!-- <li class="system-info-item">
                  <el-icon size="24"><i-custom-time /></el-icon>
                  <span class="module-label-text">{{ t('dashboard.expirationTime') }}：</span>
                  <span class="module-content-text">{{ systemData.expirationTime || '-' }}</span>
                </li> -->
              <li class="system-info-item">
                <el-icon size="24"><i-custom-storage-num /></el-icon>
                <span class="module-label-text">{{ t('measurement.databaseNum') }}：</span>
                <span class="module-content-text">{{ canReadWriteSchema ? toThousands(systemNumberData.databaseNum, '-') : t('common.noAuth') }}</span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-device-num /></el-icon>
                <span class="module-label-text">{{ t('measurement.deviceNum') }}：</span>
                <span class="module-content-text">{{ canReadWriteSchema ? toThousands(systemNumberData.deviceNum, '-') : t('common.noAuth') }}</span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-measure-num /></el-icon>
                <span class="module-label-text">{{ t('measurement.measurementNum') }}：</span>
                <span class="module-content-text">{{ canReadWriteSchema ? toThousands(systemNumberData.measurementNum, '-') : t('common.noAuth') }}</span>
              </li>
            </ul>

            <div class="table-box-wrapper">
              <el-table
                :data="tableData"
                ref="tableRef"
                style="width: 100%"
                :max-height="260"
                tooltip-effect="light"
                :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
                @sort-change="({ column, prop, order }) => handleSortChange({ column, prop, order }, 'master')"
              >
                <el-table-column :label="t('dashboard.node')" prop="address" min-width="200" align="center" show-overflow-tooltip />
                <el-table-column
                  :label="t('dashboard.type')"
                  prop="type"
                  sortable="custom"
                  :sort-orders="['ascending', 'descending', null]"
                  min-width="120"
                  align="center"
                  show-overflow-tooltip
                  label-class-name="table-sort-column-box"
                />
                <el-table-column
                  :label="t('common.status')"
                  prop="status"
                  sortable="custom"
                  :sort-orders="['ascending', 'descending', null]"
                  width="120"
                  align="left"
                  show-overflow-tooltip
                  label-class-name="table-sort-column-box"
                />
                <el-table-column
                  :label="t('dashboard.version')"
                  prop="version"
                  v-if="showVersionCol(connectionStore.connectionInfo.currentVersion || '')"
                  min-width="160"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">{{ formatVersion(row, 'master') }}</template>
                </el-table-column>
                <el-table-column :label="t('dashboard.physicalMachine')" prop="physicalMachine" min-width="160" align="center" show-overflow-tooltip />
                <template #empty>
                  <div class="table-empty-wrapper">
                    <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
                    <span class="data-empty-text">{{ t('common.noData') }}</span>
                  </div>
                </template>
              </el-table>
            </div>
          </div>

          <div class="module-box-wrapper m-b-16" v-if="canMaintain && slaveData">
            <div class="module-title-wrapper">
              <h4 class="module-title">{{ t('dashboard.slaveSystemInfo') }}</h4>
              <p class="module-details">
                <span class="module-label-text">{{ `${t('dashboard.deadTime')}：` }}</span>
                <span class="module-content-text m-r-16">{{ systemTime }}</span>
                <el-button link @click="() => handleRefreshSystem()" id="dashboard-system-slave-refresh" class="svg-button-hover-color">
                  <i-custom-refresh style="width: 24px; height: 24px" />
                </el-button>
              </p>
            </div>
            <ul class="system-info-list">
              <li class="system-info-item">
                <el-icon size="24"><i-custom-system-status /></el-icon>
                <span class="module-label-text">{{ `${t('dashboard.serverStatus')}(Running)：` }}</span>
                <span class="module-content-text" v-if="!slaveData.dataNodeRatio && !slaveData.configNodeRatio">-</span>
                <span class="module-content-text" v-else>
                  AINode {{ slaveData.aiNodeRatio ? `${slaveData.aiNodeRatio}${locale === 'en' ? '' : '个'}` : '-' }} ConfigNode
                  {{ slaveData.configNodeRatio ? `${slaveData.configNodeRatio}${locale === 'en' ? '' : '个'}` : '-' }} DataNode
                  {{ slaveData.dataNodeRatio ? `${slaveData.dataNodeRatio}${locale === 'en' ? '' : '个'}` : '-' }}
                </span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-active-status /></el-icon>
                <span class="module-label-text">{{ t('dashboard.isActive') }}：</span>
                <span class="module-content-text" :style="{ color: slaveData.active ? '#44C795' : '#D43030' }">{{ slaveData.active ? t('common.yes') : t('common.no') }}</span>
                <el-button
                  v-if="slaveData.active && showVersionCol1312(connectionStore.connectionInfo.slaveVersion || '')"
                  type="primary"
                  link
                  class="m-l-8"
                  style="text-decoration: underline"
                  @click="handleClickActive(false)"
                  id="slave-active-button"
                >
                  {{ t('dashboard.activeDetail') }}
                </el-button>
              </li>
              <!-- <li class="system-info-item">
                <el-icon size="24"><i-custom-time /></el-icon>
                <span class="module-label-text">{{ t('dashboard.expirationTime') }}：</span>
                <span class="module-content-text">{{ slaveData.expirationTime || '-' }}</span>
              </li> -->
              <li class="system-info-item">
                <el-icon size="24"><i-custom-storage-num /></el-icon>
                <span class="module-label-text">{{ t('measurement.databaseNum') }}：</span>
                <span class="module-content-text">{{ canReadWriteSchema ? toThousands(systemNumberData.databaseNum, '-') : t('common.noAuth') }}</span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-device-num /></el-icon>
                <span class="module-label-text">{{ t('measurement.deviceNum') }}：</span>
                <span class="module-content-text">{{ canReadWriteSchema ? toThousands(systemNumberData.deviceNum, '-') : t('common.noAuth') }}</span>
              </li>
              <li class="system-info-item">
                <el-icon size="24"><i-custom-measure-num /></el-icon>
                <span class="module-label-text">{{ t('measurement.measurementNum') }}：</span>
                <span class="module-content-text">{{ canReadWriteSchema ? toThousands(systemNumberData.measurementNum, '-') : t('common.noAuth') }}</span>
              </li>
            </ul>

            <div class="table-box-wrapper">
              <el-table
                :data="slaveTableData"
                ref="slaveTableRef"
                style="width: 100%"
                :max-height="260"
                tooltip-effect="light"
                :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
                @sort-change="({ column, prop, order }) => handleSortChange({ column, prop, order }, 'slave')"
              >
                <el-table-column :label="t('dashboard.node')" prop="address" min-width="200" align="center" show-overflow-tooltip />
                <el-table-column
                  :label="t('dashboard.type')"
                  prop="type"
                  sortable="custom"
                  :sort-orders="['ascending', 'descending', null]"
                  min-width="120"
                  align="center"
                  show-overflow-tooltip
                  label-class-name="table-sort-column-box"
                />
                <el-table-column
                  :label="t('common.status')"
                  prop="status"
                  sortable="custom"
                  :sort-orders="['ascending', 'descending', null]"
                  width="120"
                  align="left"
                  show-overflow-tooltip
                  label-class-name="table-sort-column-box"
                />
                <el-table-column
                  :label="t('dashboard.version')"
                  prop="version"
                  v-if="showVersionCol(connectionStore.connectionInfo.slaveVersion || '')"
                  min-width="160"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">{{ formatVersion(row, 'slave') }}</template>
                </el-table-column>
                <el-table-column :label="t('dashboard.physicalMachine')" prop="physicalMachine" min-width="160" align="center" show-overflow-tooltip />
                <template #empty>
                  <div class="table-empty-wrapper">
                    <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
                    <span class="data-empty-text">{{ t('common.noData') }}</span>
                  </div>
                </template>
              </el-table>
            </div>
          </div>

          <div class="module-box-wrapper monitor-info-wrapper">
            <div class="module-title-wrapper">
              <h4 class="module-title">{{ t('dashboard.monitorInfo') }}</h4>
              <p class="module-details" v-if="canMaintain && showPrometheus">
                <span class="module-label-text">{{ `${t('dashboard.deadTime')}：` }}</span>
                <span class="module-content-text m-r-16">{{ monitorTime }}</span>
                <el-button link @click="handleRefreshMonitor" id="dashboard-monitor-refresh" class="svg-button-hover-color"><i-custom-refresh style="width: 24px; height: 24px" /></el-button>
              </p>
            </div>

            <auth-container :is-auth="canMaintain" :content="'common.maintainAuth'" style="flex: 1">
              <div v-if="showPrometheus">
                <div class="search-form-box">
                  <ul class="search-cluster-list" v-if="slaveData">
                    <li :class="['search-cluster-type', { 'search-cluster-active': clusterType === 'master' }]" id="search-cluster-type-master" @click="handleChangeCluster('master')">
                      {{ t('dashboard.masterCluster') }}
                    </li>
                    <li :class="['search-cluster-type', { 'search-cluster-active': clusterType === 'slave' }]" id="search-cluster-type-slave" @click="handleChangeCluster('slave')">
                      {{ t('dashboard.slaveCluster') }}
                    </li>
                  </ul>
                  <span class="search-from-label">{{ t('dashboard.node') }}：</span>
                  <el-select v-model="monitorNode" :placeholder="t('common.all')" style="width: 256px" @change="handleChangeNode" id="dashboard-monitor-select-node">
                    <el-option
                      v-for="(item, index) in nodeList"
                      :key="`${item.address}(${item.type})_${index}`"
                      :value="item.nodeID"
                      :id="`dashboard-monitor-select-node-select-${item.nodeID}`"
                      :label="item.address ? `${item.address}(${item.type})` : t('common.all')"
                    />
                  </el-select>
                </div>

                <monitor-datanode
                  v-if="currentNodeType === 'DataNode'"
                  ref="monitorDatanodeRef"
                  :node="monitorNode"
                  :node-type="currentNodeType"
                  :cluster-type="clusterType"
                  @handleFetch="handleFetch"
                />
                <monitor-confignode
                  v-else-if="currentNodeType === 'ConfigNode'"
                  ref="monitorConfignodeRef"
                  :node="monitorNode"
                  :node-type="currentNodeType"
                  :cluster-type="clusterType"
                  @handleFetch="handleFetch"
                />
                <monitor-all v-else ref="monitorAllRef" :cluster-type="clusterType" @handleFetch="handleFetch" />
              </div>

              <div v-if="!configurePrometheus" class="table-empty-wrapper monitor-empty-box">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
                <span class="data-empty-text">{{ t('dashboard.unconfigPrometheus') }}</span>
              </div>

              <div v-if="configurePrometheus && !enablePrometheus" class="table-empty-wrapper monitor-empty-box">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img" />
                <span class="data-empty-text">{{ t('dashboard.configPrometheusError') }}</span>
              </div>
            </auth-container>
          </div>
        </div>

        <modal-active v-model:visible="activeVisible" :is-master="activeIsMaster" />
      </el-main>
    </el-container>
  </el-scrollbar>
</template>

<script lang="ts" setup>
import { assign, concat } from 'lodash-es';
import dayjs from 'dayjs';
import type { ElTable } from 'element-plus';
import { storeToRefs } from 'pinia';
import { useUserStore, useConnectionStore } from '@/stores';
import { DashboardApi } from '@/api';
import { toThousands } from '@/utils/format';
import { iotdbShowAuth } from '@/utils/auth';
import MonitorAll from './components/monitor-all.vue';
import MonitorDatanode from './components/monitor-datanode.vue';
import MonitorConfignode from './components/monitor-confignode.vue';
import ModalActive from './components/modal-active.vue';

const { t, locale } = useI18n();
const userStore = useUserStore();
const connectionStore = useConnectionStore();
const { enablePrometheus, configurePrometheus, canReadWriteSchema, canMaintain } = storeToRefs(userStore);
const showPrometheus = computed(() => enablePrometheus.value && configurePrometheus.value);
const tableRef = ref<InstanceType<typeof ElTable>>();
const slaveTableRef = ref<InstanceType<typeof ElTable>>();
const systemData = reactive<Dashboard.SystemData>({
  aiNodeRatio: '-',
  dataNodeRatio: '-',
  configNodeRatio: '-',
  active: false,
  expirationTime: '-',
});
const slaveData = ref<Dashboard.SystemData | null>({
  aiNodeRatio: '-',
  dataNodeRatio: '-',
  configNodeRatio: '-',
  active: false,
  expirationTime: '-',
});
const systemNumberData = reactive<Dashboard.SystemNumberData>({
  databaseNum: 0,
  deviceNum: 0,
  measurementNum: 0,
});
const searchFormData = reactive<{
  orderBy: string[];
  asc: string[];
}>({
  orderBy: ['type', 'type'],
  asc: ['', ''],
});
const activeVisible = ref(false);
const activeIsMaster = ref(true);
const clusterType = ref<'master' | 'slave'>('master');
const tableData = ref<Dashboard.NodeItem[]>([]);
const slaveTableData = ref<Dashboard.NodeItem[]>([]);
const refreshInterval = ref();
const systemTime = ref();
const monitorTime = ref();
const monitorNode = ref('');
const masterNodes = ref<Dashboard.NodeItem[]>([]);
const slaveNodes = ref<Dashboard.NodeItem[]>([]);
const currentNodeType = ref('');
const monitorAllRef = ref<InstanceType<typeof MonitorAll>>();
const monitorDatanodeRef = ref<InstanceType<typeof MonitorDatanode>>();
const monitorConfignodeRef = ref<InstanceType<typeof MonitorConfignode>>();
const nodeList = computed(() => {
  if (clusterType.value === 'slave') {
    return slaveNodes.value.filter((item) => item.type !== 'AINode');
  }
  return masterNodes.value.filter((item) => item.type !== 'AINode');
});

function showVersionCol(version: string) {
  if (!version) return false;
  return iotdbShowAuth(version, '1.2.1');
}

function showVersionCol1312(version: string) {
  if (!version) return false;
  return iotdbShowAuth(version, '1.3.1.2');
}

function formatVersion(row: Dashboard.NodeItem, type: 'slave' | 'master') {
  if (type === 'slave') {
    if (slaveData.value!.active || row.version.split('.').length === 4) {
      return t('dashboard.versionEnterprise', { version: row.version });
    }
    return t('dashboard.versionOpenSource', { version: row.version });
  }
  if (systemData.active || row.version.split('.').length === 4) {
    return t('dashboard.versionEnterprise', { version: row.version });
  }
  return t('dashboard.versionOpenSource', { version: row.version });
}

const { requestFn: getSystemInfo, loading } = useRequest(DashboardApi.getSystemInfo);

function getMonitorData() {
  monitorTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  if (currentNodeType.value === 'DataNode') {
    nextTick(() => {
      // monitorDatanodeRef.value?.initialAssign();
      if (monitorDatanodeRef.value) {
        monitorDatanodeRef.value?.getInitial();
      } else {
        getMonitorData();
      }
    });
  } else if (currentNodeType.value === 'ConfigNode') {
    nextTick(() => {
      // monitorConfignodeRef.value?.initialAssign();
      if (monitorConfignodeRef.value) {
        monitorConfignodeRef.value?.getInitial();
      } else {
        getMonitorData();
      }
    });
  } else {
    nextTick(() => {
      // monitorAllRef.value?.initialAssign();
      if (monitorAllRef.value) {
        monitorAllRef.value?.getInitial();
      } else {
        getMonitorData();
      }
    });
  }
}

function getSystemData() {
  systemTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
  return getSystemInfo(searchFormData.orderBy, searchFormData.asc).then((res) => {
    assign(systemNumberData, res.data);
    assign(systemData, res.data.masterNodeInfo);
    tableData.value = res.data.masterNodeInfo.nodes || [];
    if (tableData.value.length > 0) {
      connectionStore.setMasterConnectionStatus(true);
    }
    masterNodes.value = concat(
      [
        {
          nodeID: '',
          address: '',
          type: '',
          status: '',
          version: '',
          physicalMachine: '',
        },
      ],
      res.data.masterNodeInfo.nodes ? [...res.data.masterNodeInfo.nodes.filter((item) => item.type === 'ConfigNode'), ...res.data.masterNodeInfo.nodes.filter((item) => item.type === 'DataNode')] : []
    );
    if (res.data.slaveNodeInfo) {
      assign(slaveData.value, res.data.slaveNodeInfo);
      slaveTableData.value = res.data.slaveNodeInfo.nodes || [];
      slaveNodes.value = concat(
        [
          {
            nodeID: '',
            address: '',
            type: '',
            status: '',
            version: '',
            physicalMachine: '',
          },
        ],
        res.data.slaveNodeInfo.nodes ? [...res.data.slaveNodeInfo.nodes.filter((item) => item.type === 'ConfigNode'), ...res.data.slaveNodeInfo.nodes.filter((item) => item.type === 'DataNode')] : []
      );
    } else {
      slaveData.value = null;
      slaveTableData.value = [];
      slaveNodes.value = [];
    }

    let flag = masterNodes.value.some((s) => s.nodeID === monitorNode.value);
    if (slaveData.value && clusterType.value === 'slave') {
      flag = slaveNodes.value.some((s) => s.nodeID === monitorNode.value);
    }
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
function handleSortChange({ column, prop, order }: SortMethod<Alarm.QueryConfigResult>, type: 'master' | 'slave') {
  if (type === 'master') {
    if (order === 'ascending') {
      searchFormData.asc[0] = 'asc';
    } else if (order === 'descending') {
      searchFormData.asc[0] = 'desc';
    } else {
      searchFormData.asc[0] = '';
    }
    searchFormData.orderBy[0] = prop;
  }
  if (type === 'slave') {
    if (order === 'ascending') {
      searchFormData.asc[1] = 'asc';
    } else if (order === 'descending') {
      searchFormData.asc[1] = 'desc';
    } else {
      searchFormData.asc[1] = '';
    }
    searchFormData.orderBy[1] = prop;
  }
  handleRefreshSystem();
}

function handleChangeCluster(type: 'master' | 'slave') {
  clusterType.value = type;
  monitorNode.value = '';
  currentNodeType.value = '';
  handleRefreshMonitor();
}

function handleClickActive(isMaster: boolean) {
  activeIsMaster.value = isMaster;
  activeVisible.value = true;
}

watch(
  () => canMaintain.value,
  (val) => {
    if (val) {
      getSystemData();
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => connectionStore.connectionIsMaster,
  (val, old) => {
    if (val !== old && (val === true || val === false)) {
      clusterType.value = val ? 'master' : 'slave';
    }
  },
  {
    immediate: true,
  }
);

watch(
  () => canMaintain.value && showPrometheus.value,
  (val, old) => {
    if (val !== old && val) {
      getMonitorData();
    }
  },
  {
    immediate: true,
  }
);

watch(locale, () => {
  nextTick(() => {
    handleRefreshSystem();
  });
});

onUnmounted(() => {
  clearTimeout(refreshInterval.value);
});
</script>

<style lang="scss" scoped>
.module-box-wrapper {
  border-radius: 6px;
  background: #fff;
  padding: 16px;
  box-sizing: border-box;
}

.module-title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .module-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 21px;
    color: #495ad4;
  }
}

.module-label-text {
  font-size: 12px;
  font-weight: 400;
  line-height: 12px;
  color: #131926;
  margin-right: 4px;
}

.module-content-text {
  font-size: 12px;
  font-weight: 400;
  line-height: 12px;
  color: #656a85;
}

.system-info-list {
  display: flex;
  flex-wrap: wrap;

  .system-info-item {
    display: flex;
    align-items: center;
    margin: 0 24px 0 0;
    height: 34px;

    &:last-child {
      margin: 0;
    }
  }
}

.table-box-wrapper {
  border-radius: 2px;
  background: #f7f8fc;
  padding: 8px;
}

.search-form-box {
  margin: 18px 0 6px;
  display: flex;
  align-items: center;

  .search-cluster-list {
    display: flex;
    margin-right: 36px;
    border-radius: 12px;
    background-color: #f0f1fa;
    padding: 3px 4px;

    .search-cluster-type {
      padding: 3px 12px;
      cursor: pointer;
      border-radius: 12px;
      background-color: transparent;
      font-size: 12px;
      line-height: 12px;
      color: #656a85;
    }

    .search-cluster-active {
      background-color: #495ad4;
      color: #fff;
    }
  }

  .search-from-label {
    font-size: 14px;
    font-weight: 400;
    line-height: 21px;
    color: #424561;
    flex: 0 0 50px;
  }
}

:deep(.el-scrollbar__view) {
  height: 100%;
}

.monitor-info-wrapper {
  // min-height: calc(100% - 400px);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.monitor-empty-box {
  flex: 1;
}
</style>
<style lang="scss">
@import './components/monitor-module';
</style>
