<template>
  <el-main class="p-0">
    <div class="module-title-wrapper">
      <h4 class="module-title">状态监控</h4>
      <div>
        <span class="search-from-label">节点：</span>
        <el-select v-model="monitorNode" placeholder="全部" style="width: 256px;" @change="handleChangeNode" id="dashboard-monitor-select-node">
          <el-option v-for="(item, index) in nodeList" :key="`${item.address}(${item.type})_${index}`" :value="item.nodeID" :label="item.address ? `${item.address}(${item.type})` : '全部'" />
        </el-select>
      </div>
      <p class="module-details">
        <span class="module-label-text">数据截止：</span>
        <span class="module-content-text m-r-16">{{ monitorTime }}</span>
        <el-button link @click="handleRefreshMonitor" id="dashboard-monitor-refresh"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
      </p>
    </div>
  </el-main>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';

const refreshInterval = ref();
const monitorTime = ref();
const monitorNode = ref('');
const currentNodeType = ref('');
const nodeList = ref<Dashboard.NodeItem[]>([]);

function getMonitorData() {
  monitorTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss');
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

onUnmounted(() => {
  clearTimeout(refreshInterval.value);
});
</script>
