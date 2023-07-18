<template>
  <el-container class="details-wrapper">
    <el-main class="p-0">
      <div class="module-box-wrapper m-b-16">
        <div class="module-title-wrapper">
          <h4 class="module-title">系统信息</h4>
          <p class="module-details">
            <span class="module-label-text">数据截止：</span>
            <span class="module-content-text"></span>
            <el-button link @click="handleRefreshSystem"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
          </p>
        </div>
        <ul class="system-info-list">
          <li class="system-info-item">
            <el-icon size="24"><i-custom-storage-num /></el-icon>
            <span class="module-label-text">服务器状态(Running)：</span>
            <span class="module-content-text"></span>
          </li>
          <li class="system-info-item">
            <el-icon size="24"><i-custom-storage-num /></el-icon>
            <span class="module-label-text">是否激活：</span>
            <span class="module-content-text"></span>
          </li>
          <li class="system-info-item">
            <el-icon size="24"><i-custom-storage-num /></el-icon>
            <span class="module-label-text">到期时间：</span>
            <span class="module-content-text"></span>
          </li>
          <li class="system-info-item">
            <el-icon size="24"><i-custom-storage-num /></el-icon>
            <span class="module-label-text">数据库数量：</span>
            <span class="module-content-text"></span>
          </li>
          <li class="system-info-item">
            <el-icon size="24"><i-custom-device-num /></el-icon>
            <span class="module-label-text">设备数量：</span>
            <span class="module-content-text"></span>
          </li>
          <li class="system-info-item">
            <el-icon size="24"><i-custom-measure-num /></el-icon>
            <span class="module-label-text">测点数量：</span>
            <span class="module-content-text"></span>
          </li>
        </ul>

        <div class="table-box-wrapper">
          <el-table
            :data="tableData"
            v-loading="loading"
            style="width: 100%;"
            :height="260"
            :max-height="260"
            tooltip-effect="light"
            :tooltip-options="{ popperClass: 'table-tooltip-max-width' }"
          >
            <el-table-column label="节点" prop="ip" min-width="200" align="center" show-overflow-tooltip />
            <el-table-column label="类型" prop="nodeType" min-width="120" align="center" show-overflow-tooltip />
            <el-table-column label="状态" prop="status" min-width="120" align="center" show-overflow-tooltip />
            <el-table-column label="版本" prop="version" min-width="90" align="center" show-overflow-tooltip />
            <el-table-column label="物理机" prop="ip" min-width="160" align="center" show-overflow-tooltip />
            <template #empty>
              <div class="table-empty-wrapper">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                <span class="data-empty-text">无数据</span>
              </div>
            </template>
          </el-table>
        </div>
      </div>

      <div class="module-box-wrapper">
        <div class="module-title-wrapper">
          <h4 class="module-title">监控信息</h4>
          <p class="module-details">
            <span class="module-label-text">数据截止：</span>
            <span class="module-content-text"></span>
            <el-button link @click="handleRefreshMonitor"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
          </p>
        </div>

        <div class="search-form-box">
          <span class="search-from-label">节点：</span>
          <el-select v-model="monitorNode" placeholder="全部" style="width: 256px;">
            <el-option v-for="item in nodeList" :key="item" :value="item" :label="item" />
          </el-select>
        </div>

        <div class="monitor-info-wrapper">
          <div class="monitor-info-box">
          </div>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>

const tableData = ref([]);
const loading = ref(false);
const systemInterval = ref();
const monitorInterval = ref();
const monitorNode = ref('');
const nodeList = ref([]);

// 刷新系统
function handleRefreshSystem() {
  clearInterval(systemInterval.value);
  systemInterval.value = setInterval(() => {
    console.log('handleRefreshSystem');
  }, 30 * 1000);
}

// 刷新监控
function handleRefreshMonitor() {
  clearInterval(monitorInterval.value);
  monitorInterval.value = setInterval(() => {
    console.log('handleRefreshMonitor');
  }, 30 * 1000);
}

onUnmounted(() => {
  clearInterval(systemInterval.value);
  clearInterval(monitorInterval.value);
});
</script>

<style lang="scss" scoped>
.module-box-wrapper{
  border-radius: 6px;
  background: #FFF;
  padding: 16px;
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
    margin: 8px 0;
  }
}

.table-box-wrapper{
  border-radius: 2px;
  background: #F7F8FC;
  padding: 8px;
}

.search-form-box{
  margin: 18px 0;
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
</style>
