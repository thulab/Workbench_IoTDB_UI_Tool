<template>
  <div class="storage-page-container">
    <div class="storage-list-wrapper">
      <storage-side
        ref="storageSideRef"
        @handleAddStorage="storageVisible = true"
        @handleSelectStorage="val => currentStorage = val"
      />
    </div>

    <el-scrollbar class="storage-details-wrapper">
      <h4 class="storage-info-title">数据库信息</h4>
      <div class="page-info-box">
        <ul class="storage-info-list">
          <li class="storage-info-item"><el-icon size="24"><i-custom-storage-num /></el-icon><span class="storage-info-item-label">数据库名称：</span><text-tooltip :content="currentStorage" /></li>
          <li class="storage-info-item storage-info-item-ttl">
            <el-icon size="24"><i-custom-time /></el-icon>
            <span class="storage-info-item-label">数据保存时间：<el-tooltip effect="light" content="数据保存时间（TTL），到期后系统将自动删除数据，此处不填代表永久存储" placement="top" popper-class="tooltip-box-width"><i-custom-question class="ttl-tip" /></el-tooltip></span>
            <span v-if="!editTTL">{{ storageInfos?.ttl ? (storageInfos.ttl + getTtlTimeUnit(storageInfos.ttlUnit, ttlUnitOptions)) : '∞'}}</span>
            <div v-if="currentStorage && editTTL" class="edit-ttl-box">
              <el-input v-model="editTTLModel" min="0" max="9007199254740992" class="ttl-input" style="width:120px;">
                <template #append>
                  <el-select v-model="editTTLUnitModel" class="ttl-input unit" clearable placeholder=" " style="width:50px;">
                    <el-option label="毫秒" value="millisecond" />
                    <el-option label="秒" value="second" />
                    <el-option label="分" value="minute" />
                    <el-option label="小时" value="hour" />
                    <el-option label="天" value="day" />
                  </el-select>
                </template>
              </el-input>
              <el-button class="m-l-12" plain @click="editTTL = false">取消</el-button>
              <el-button type="primary" @click="handleConfirmEditTTL">确定</el-button>
            </div>
            <el-button link v-if="currentStorage && !editTTL" class="m-l-12" @click="handleEditTTL"><i-custom-edit /></el-button>
          </li>
          <br>
          <li class="storage-info-item"><el-icon size="24"><i-custom-device-num /></el-icon><span class="storage-info-item-label">设备数量：</span>{{ storageInfos?.deviceCount || 0 }}</li>
          <li class="storage-info-item"><el-icon size="24"><i-custom-measure-num /></el-icon><span class="storage-info-item-label">测点数量：</span>{{ storageInfos?.measurementCount || 0 }}</li>
          <li class="storage-info-item"><el-icon size="24"><i-custom-total-num /></el-icon><span class="storage-info-item-label">数据总量：</span>{{ storageInfos?.dataCount || 0 }}</li>
        </ul>

        <div class="page-detail-buttons">
          <el-button plain class="el-button-delete" :disabled="!currentStorage" @click="handleDelStorage">删除</el-button>
        </div>
      </div>

      <h4 class="storage-info-title">测点列表</h4>
      <template v-if="currentStorage">
        <div class="search-form-wrapper">
          <div class="search-form-box">
            <span class="search-from-label">测点选择：</span>
            <el-input v-model="searchKeyword" placeholder="请输入测点名称" @keyup.enter="handleRefresh">
              <template #prefix>
                <i-custom-search-icon class="remote-select-search-icon" @click="handleRefresh" />
              </template>
            </el-input>
          </div>

          <div class="search-form-buttons">
            <el-button type="primary" @click="handleAddMeasure">新建</el-button>
            <el-button class="m-l-16" @click="handleImport">导入</el-button>
            <el-dropdown class="m-x-16" :disabled="!(totalCount > 0)" @command="val => handleCommandDown(val)">
              <el-button class="export-btn" :disabled="!(totalCount > 0)">导出<el-tooltip effect="light" content="excel格式最大支持下载量为2G，csv无限制，推荐使用csv格式导出" placement="top" popper-class="tooltip-box-width"><i-custom-question class="export-tip" /></el-tooltip></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="csv">以.csv格式导出</el-dropdown-item>
                  <el-dropdown-item command="xlsx">以.xlsx格式导出</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button link @click="handleRefresh"><i-custom-refresh style="width: 24px;height: 24px;" /></el-button>
          </div>
        </div>
        <div class="batch-operate" v-if="multipleSelection.length">
          <div class="select-tip-box">
            <el-icon size="16" class="m-r-12"><i-custom-warning-blue /></el-icon>
            <span class="select-tip">已选择 <span style="color: #495AD4">{{ multipleSelection.length }}</span> 项</span>
          </div>
          <el-button link type="primary" @click="handleDelRow('batch', null)">删除</el-button>
        </div>
        <div class="storage-table-box">
          <el-table
            :data="tableData.measurements"
            v-loading="loading"
            style="width: 100%;"
            :height="totalCount > 0 ? maxTableHeight : maxTableHeight + 52"
            :max-height="totalCount > 0 ? maxTableHeight : maxTableHeight + 52"
            tooltip-effect="light"
            ref="tableRef"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="设备名称" prop="deviceName" min-width="200" align="center" show-overflow-tooltip />
            <el-table-column label="测点名称" prop="timeseries" width="160" align="center" show-overflow-tooltip />
            <el-table-column label="数据类型" prop="dataType" width="140" align="center" show-overflow-tooltip />
            <el-table-column label="编码方式" prop="encoding" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column label="压缩方式" prop="compression" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column label="最新值" prop="value" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column label="最新值时间" prop="valueTime" min-width="200" align="center" show-overflow-tooltip />
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleRowAlarm(row)">告警详情</el-button>
                <el-button type="primary" link size="small" @click="handleRowTrend(row)">趋势</el-button>
                <el-button type="primary" link size="small" @click="handleDelRow('row', row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <div class="table-empty-wrapper">
                <img src="@/assets/data-empty.png" alt="" class="data-empty-img">
                <span class="data-empty-text">无数据</span>
              </div>
            </template>
          </el-table>

          <el-pagination
            v-if="totalCount > 0"
            v-model:currentPage="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            class="m-t-20"
            layout="prev, pager, next, sizes, jumper"
            background
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCount"
            @size-change="onChangePageSize"
            @current-change="onChangePage"
          />
        </div>
      </template>
    </el-scrollbar>

    <modal-storage
      v-model:visible="storageVisible"
      @handleSave="handleSaveStorage"
    />

    <modal-measurement
      v-model:visible="measurementVisible"
      :group-name="currentStorage"
      @handleSave="handleSaveMeasurement"
    />

    <modal-import
      v-model:visible="importVisible"
      @handle-close="handleImportClose"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useTableHeight } from '@/composition-api';
import { StorageApi } from '@/api';
import ICustomMessageWarning from '~icons/custom/message-warning.svg';
import StorageSide from './components/storage-side.vue';
import ModalStorage from './components/modal-storage.vue';
import ModalMeasurement from './components/modal-measurement.vue';
import ModalImport from './components/modal-import.vue';

const router = useRouter();

const ttlUnitOptions = [
  { label: '毫秒', value: 'millisecond' },
  { label: '秒', value: 'second' },
  { label: '分', value: 'minute' },
  { label: '小时', value: 'hour' },
  { label: '天', value: 'day' },
];

const { maxTableHeight } = useTableHeight(410);
const storageSideRef = ref<InstanceType<typeof StorageSide>>();
const currentStorage = ref('');
const searchKeyword = ref('');
const storageInfos = ref<StorageDevice.GetStorageGroupsInfoResponse>({
  groupName: '',
  ttl: undefined,
  ttlUnit: undefined,
  deviceCount: 0,
  measurementCount: 0,
  dataCount: 0,
});
const pagination = reactive({
  pageSize: 10,
  pageNum: 1,
});
const totalCount = ref(0);
const multipleSelection = ref<StorageDevice.MeasurementItem[]>([]);
const editTTL = ref(false);
const editTTLModel = ref();
const editTTLUnitModel = ref('day');
const storageVisible = ref(false);
const measurementVisible = ref(false);
const importVisible = ref(false);

const { requestFn: deleteStorageGroups } = useRequest(StorageApi.deleteStorageGroups);
const { requestFn: getStorageGroupsInfo } = useRequest(StorageApi.getStorageGroupsInfo);
const { requestFn: upsertDatabaseTTL } = useRequest(StorageApi.upsertDatabaseTTL);
const { requestFn: getMeasurementsInfosByFuzzy, data: tableData, loading } = useRequest(StorageApi.getMeasurementsInfosByFuzzy, {
  initData: {
    totalCount: 0,
    totalPage: 1,
    measurements: [],
  },
});
const { requestFn: getLastValue } = useRequest(StorageApi.getLastValue);
const { requestFn: deleteMeasurements } = useRequest(StorageApi.deleteMeasurements);
const { requestFn: exportMeasurementData } = useRequest(StorageApi.exportMeasurementData);

const getTtlTimeUnit = (val: string | undefined, options: Array<{ label: string, value: string }>) => {
  if (!val) return '';
  const data = options.find((f) => f.value === val);
  return data ? data.label : '';
};

// 列表接口
function getListData() {
  getMeasurementsInfosByFuzzy({
    dataBaseOrDevice: 'database',
    pathName: currentStorage.value,
    keyword: searchKeyword.value,
    ...pagination,
  }).then((res) => {
    totalCount.value = res.data.totalCount;
    if (tableData.value.measurements?.length) {
      tableData.value.measurements.forEach((item) => {
        if (item && item.timeseries) {
          getLastValue(item.deviceName, item.timeseries).then((newRes) => {
            if (newRes.code === 0) {
              item.value = newRes.data.value;
              item.valueTime = newRes.data.valueTime;
            }
          });
        }
      });
    }
  });
}

// 存储组详细信息
function getStorageInfo(data: string) {
  getStorageGroupsInfo(data).then((res) => {
    if (res?.code === 0) {
      storageInfos.value = res.data;
    }
  });
}

// 删除数据库
function handleDelStorage() {
  ElMessageBox.confirm('此操作会删除数据库下全部测点和数据，是否删除？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      deleteStorageGroups(currentStorage.value).then((res) => {
        if (res.code === 0) {
          ElMessage.success('删除存储组成功');
          storageSideRef.value?.getStorageList();
        }
      });
    });
}

// 保存数据库
function handleSaveStorage() {
  storageSideRef.value?.getStorageList();
}

// 查询
function handleRefresh() {
  pagination.pageNum = 1;
  getListData();
}

function onChangePageSize(val: number) {
  pagination.pageSize = val;
  pagination.pageNum = 1;
  getListData();
}

function onChangePage(page: number) {
  pagination.pageNum = page;
  getListData();
}

// 导出
function handleExportData(exportType: string) {
  exportMeasurementData({
    pathName: currentStorage.value,
    keyword: searchKeyword.value,
    ...pagination,
  }).then((res) => {
    let url = `/api/file/exportExcelMeasurementData?exportId=${res.data}`;
    if (exportType === 'csv') {
      url = `/api/file/exportCSVMeasurementData?exportId=${res.data}`;
    }
    window.open(url);
  });
}

// 下载
function handleCommandDown(val: string) {
  handleExportData(val);
}

// 新增测点
function handleAddMeasure() {
  measurementVisible.value = true;
}

// 导入
function handleImport() {
  importVisible.value = true;
}

// 删除行
function handleDelRow(type: string, row: StorageDevice.MeasurementItem | null) {
  ElMessageBox.confirm('是否删除测点？', '注意', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    icon: ICustomMessageWarning,
  })
    .then(() => {
      let measurementList = [];
      if (type === 'batch') {
        measurementList = multipleSelection.value?.map((i) => `${i.deviceName}.${i.timeseries}`);
      } else {
        measurementList = row?.timeseries ? [`${row.deviceName}.${row.timeseries}`] : [];
      }
      deleteMeasurements(measurementList).then((res) => {
        if (res.code === 0) {
          ElMessage.success('删除成功');
          getStorageInfo(currentStorage.value);
          handleRefresh();
        }
      });
    });
}

function handleRowAlarm(row: StorageDevice.MeasurementItem) {
  router.push({
    name: 'AlarmConfig',
    query: {
      measurement: `${row.deviceName}.${row.timeseries}`,
    },
  });
}

function handleRowTrend(row: StorageDevice.MeasurementItem) {
  router.push({
    name: 'TrendDetail',
    query: {
      measurement: `${row.deviceName}.${row.timeseries}`,
    },
  });
}

function handleSelectionChange(vals: StorageDevice.MeasurementItem[]) {
  multipleSelection.value = vals;
}

// 保存物理量
function handleSaveMeasurement() {
  getStorageInfo(currentStorage.value);
  handleRefresh();
}

// 导入物理量
function handleImportClose(reload: boolean) {
  if (reload) {
    handleSaveMeasurement();
  }
}

function handleEditTTL() {
  editTTL.value = true;
  editTTLModel.value = storageInfos.value?.ttl;
  editTTLUnitModel.value = storageInfos.value?.ttlUnit || 'day';
}

function handleConfirmEditTTL() {
  if (editTTLModel.value && !/^[1-9]\d*$/.test(editTTLModel.value)) {
    ElMessage.error('存活时间只能为正整数');
    return;
  }
  if (editTTLModel.value && +editTTLModel.value > 9007199254740992) {
    ElMessage.error('存活时间不能超过9007199254740992');
    return;
  }
  if ((editTTLModel.value && !editTTLUnitModel.value) || (!editTTLModel.value && editTTLUnitModel.value)) {
    ElMessage.error('存活时间和存活时间单位必须同时填写');
    return;
  }
  const reqObj = {
    groupName: storageInfos.value.groupName,
    ttl: !editTTLModel.value ? undefined : +editTTLModel.value,
    ttlUnit: editTTLUnitModel.value || undefined,
  };
  upsertDatabaseTTL({ ...reqObj }).then((res) => {
    if (res.code === 0) {
      ElMessage.success('更新成功！');
      editTTL.value = false;
      getStorageInfo(storageInfos.value.groupName);
    }
  });
}

watch(
  () => currentStorage.value,
  (val, old) => {
    if (val !== old) {
      if (!val) {
        storageInfos.value = {
          groupName: '',
          ttl: undefined,
          ttlUnit: undefined,
          deviceCount: 0,
          measurementCount: 0,
          dataCount: 0,
        };
      } else {
        getStorageInfo(val);
        handleRefresh();
      }
    }
  },
  {
    immediate: true,
  },
);

</script>

<style lang="scss" scoped>
.storage-page-container {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.storage-list-wrapper{
  width: 240px;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  box-sizing: border-box;

}

.storage-details-wrapper{
  width: calc(100% - 256px);
  margin-left: 256px;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;

  .page-info-box {
    display: flex;
    justify-content: space-between;
    padding: 8px 16px;
  }

  .storage-info-list {
    flex: 1;
  }

  .storage-info-item {
    font-size: 12px;
    line-height: 12px;
    color: #656A85;
    margin: 0 20px 6px 0;
    display: inline-flex;
    align-items: center;
    width: 160px;

    .storage-info-item-label{
      color: #131926;
      position: relative;
      margin-right: 4px;
      white-space: nowrap;

      .ttl-tip{
        position: absolute;
        right: -2px;
        top: -4px;
      }
    }
  }

  .storage-info-item-ttl{
    width: 380px;
  }
}

.storage-info-title{
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: #495AD4;
  padding: 14px 0 6px 16px;
  border-bottom: 1px solid #DFE1ED;
}

.search-form-wrapper{
  display: flex;
  justify-content: space-between;
  padding: 16px;

  .search-form-box{
    display: flex;
    align-items: center;

    .search-from-label{
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
      color: #131926;
      flex: 0 0 80px;
    }
  }

  .search-form-buttons{
    // align-self: flex-end;
    // margin-bottom: 18px;
    // flex: 0 0 180px;

    .export-btn{
      position: relative;

      .export-tip{
        position: absolute;
        right: 6px;
        top: 2px;
      }
    }
  }
}

.storage-table-box{
  margin: 0 16px 16px;
  padding: 16px;
  background-color: #F7F8FC;
}

:deep(.el-select-v2__selection){
  flex-wrap: nowrap;
}

.batch-operate{
  background: #F0F1FA;
  padding: 6px 16px;
  margin: 0 16px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
}

.select-tip-box{
  display: flex;
  align-items: center;
}
</style>
