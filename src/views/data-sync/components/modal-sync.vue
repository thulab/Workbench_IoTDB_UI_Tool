<template>
  <el-dialog
    :title="editType === 'add' ? '新建任务' : '任务详情'"
    v-model="dialogVisible"
    width="760px"
    align-center
    :close-on-click-modal="false"
    id="data-sync-modal"
  >
    <div class="form-wrapper" v-loading="loading">
      <span class="tabs-tip"><el-icon size="14" style="margin-right: 2px;"><i-custom-info-warning /></el-icon>最终提交信息为您提交时所在的页签内容</span>
      <el-tabs type="card" v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="界面选择" name="select">
          <el-scrollbar class="p-16">
            <el-form ref="formRef" :model="formData" label-position="left" class="form-wrapper" :disabled="editType === 'view'">
              <label><input type="password" autocomplete="new-password" hidden></label>
              <base-form-item label="任务名称:" prop="name" :rules="requiredNameRules" class="form-label-width" :error="errorName">
                <el-input v-model="formData.name" placeholder="请输入字母、数字、汉字、下划线，其他字符需用反引号进行整体修饰，例如：`数据同步-1`" type="textarea" :rows="2" id="data-sync-modal-name" :resize="'none'" style="width: 360px;" maxlength="100" show-word-limit />
              </base-form-item>
              <h4 class="form-module-title">抽取设置</h4>
              <div class="flex-align-center">
                <base-form-item label="同步测点:" prop="whole" :rules="requiredRules" class="form-label-width">
                  <template #label>
                    同步测点:<el-tooltip effect="light" content="需用反引号修饰不合法字符或者是不合法路径节点，例如：root.`a@b`" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
                  </template>
                  <el-radio-group v-model="formData.whole">
                    <el-radio :label="true">全局</el-radio>
                    <el-radio :label="false" class="radio-tip">前缀路径<el-tooltip
                      effect="light"
                      content="路径前缀不需要能够构成完整的路径，例如：输入'root.database'，则同步的数据范围为'root.database*.**'
注：root.__system不会被同步"
                      placement="top"
                      popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip></el-radio>
                  </el-radio-group>
                </base-form-item>
                <base-form-item v-if="!formData.whole" label="" prop="path" :rules="formData.whole ? [] : requiredRules" class="form-item-no-label m-l-24">
                  <el-input v-model="formData.path" placeholder="请输入前缀路径" style="width:335px;" id="data-sync-modal-path">
                    <template #prepend>root.</template>
                  </el-input>
                </base-form-item>
              </div>
              <base-form-item label="二次转发:" prop="reforward" :rules="requiredRules" class="form-label-width">
                <template #label>
                  二次转发:<el-tooltip effect="light" content="转发数据：对同步到数据库的新数据进行转发。例如：如构建 A->B->C的数据转发，那么B->C的同步需要将该参数为“是”后，A->B 中A通过同步写入B的数据才能被正确转发到C，需注意构建A<->B的双向数据转发，那么A->B和B->A的同步都需将该参数设置为“否”，否则会造成数据无休止的集群间循环转发，请谨慎操作！" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
                </template>
                <el-radio-group v-model="formData.reforward">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </base-form-item>
              <div class="flex-align-center">
                <base-form-item label="历史数据:" prop="isSynchronHistory" :rules="requiredRules" class="form-label-width">
                  <template #label>
                    历史数据:<el-tooltip effect="light" content="创建任务前写入数据库的数据称为历史数据，请注意历史数据与实时数据不能同时为关闭状态！" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
                  </template>
                  <el-switch
                    v-model="formData.isSynchronHistory"
                    :active-value="true"
                    :inactive-value="false"
                    style="

      --el-switch-on-color: #44C795; --el-switch-off-color: #DFE1ED;"
                    id="data-sync-modal-history-switch"
                  />
                </base-form-item>
                <base-form-item v-if="formData.isSynchronHistory" label="时间范围：" prop="datetimerange" :rules="requiredRules" class="m-l-24">
                  <el-date-picker
                    v-model="formData.datetimerange"
                    type="datetimerange"
                    range-separator="～"
                    unlink-panels
                    :disabled-date="disabledDate"
                    :shortcuts="shortcutsDaterange"
                    :clearable="false"
                    :prefix-icon="ICustomCalender"
                    id="data-sync-modal-history-datetimerange"
                  />
                </base-form-item>
              </div>
              <div class="flex-align-center">
                <base-form-item label="实时数据:" prop="isSynchronRealTime" :rules="requiredRules" class="form-label-width">
                  <template #label>
                    实时数据:<el-tooltip effect="light" content="创建任务后写入数据库的数据称为实时数据，请注意实时数据与历史数据不能同时为关闭状态！" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
                  </template>
                  <el-switch
                    v-model="formData.isSynchronRealTime"
                    :active-value="true"
                    :inactive-value="false"
                    style="

      --el-switch-on-color: #44C795; --el-switch-off-color: #DFE1ED;"
                    id="data-sync-modal-running-switch"
                    @change="val => handleChangeRunningSwitch(val as boolean)"
                  />
                </base-form-item>
                <base-form-item v-if="formData.isSynchronRealTime" label="触发模式：" prop="triggerMode" :rules="requiredRules" class="form-item-label-short m-l-24">
                  <template #label>
                    触发模式:<el-tooltip
                      effect="light"
                      placement="top"
                      popper-class="table-tooltip-max-width">
                      <template #content>日志模式：该模式下，任务仅使用操作日志进行数据处理、发送<br>文件模式：该模式下，任务仅使用数据文件进行数据处理、发送</template><i-custom-question /></el-tooltip>
                  </template>
                  <el-radio-group v-model="formData.triggerMode" @change="val => handleChangeTriggerMode(val as string as 'hybrid' | 'log' | 'file')">
                    <el-radio :label="'hybrid'">混合模式</el-radio>
                    <el-radio :label="'log'">日志模式</el-radio>
                    <el-radio :label="'file'">文件模式</el-radio>
                  </el-radio-group>
                </base-form-item>
              </div>
              <h4 class="form-module-title">处理设置</h4>
              <div class="flex-align-center">
                <base-form-item label="处理插件：" prop="processorPluginType" :rules="requiredRules" class="form-label-width">
                  <el-select v-model="formData.processorPluginType" :style="{ width: formData.processorPluginType === 'custom' ? '152px' : '360px' }" id="data-sync-modal-select-deal">
                    <el-option
                      v-for="(item, i) in dealOptions"
                      :key="`${item.pluginName}_${i}_deal`"
                      :label="item.pluginType === 'external' ? item.pluginDesc : `${item.pluginDesc}(${item.pluginName})`"
                      :value="item.pluginName"
                    />
                  </el-select>
                </base-form-item>
                <base-form-item v-if="formData.processorPluginType === 'custom'" label="" prop="processorPluginName" :rules="requiredRules" class="form-item-no-label m-l-8">
                  <el-input v-model="formData.processorPluginName" placeholder="请输入处理插件名称" style="width:200px;" id="data-sync-modal-deal-name" />
                </base-form-item>
              </div>
              <base-form-item v-if="formData.processorPluginType === 'custom'" label="插件参数：" prop="processorPluginParam" class="form-label-width">
                <el-input v-model="formData.processorPluginParam" type="textarea" placeholder="请输入插件参数，例如:'processor.alarm_id' = '582'" style="width:360px;" :resize="'none'" :rows="4" id="data-sync-modal-deal-params" />
              </base-form-item>
              <h4 class="form-module-title">发送设置</h4>
              <div class="flex-align-center">
                <base-form-item label="发送插件：" prop="connectorPluginType" :rules="requiredRules" class="form-label-width">
                  <el-select v-model="formData.connectorPluginType" :style="{ width: formData.connectorPluginType === 'custom' ? '152px' : '360px' }" id="data-sync-modal-select-send">
                    <el-option
                      v-for="(item, i) in sendOptions"
                      :key="`${item.pluginName}_${i}_send`"
                      :label="item.pluginType === 'external' ? item.pluginDesc : `${item.pluginDesc}(${item.pluginName})`"
                      :value="item.pluginName"
                    />
                  </el-select>
                </base-form-item>
                <base-form-item v-if="formData.connectorPluginType === 'custom'" label="" prop="connectorPluginName" :rules="requiredRules" class="form-item-no-label m-l-8">
                  <el-input v-model="formData.connectorPluginName" placeholder="请输入发送插件名称" style="width:200px;" id="data-sync-modal-send-name" />
                </base-form-item>
              </div>
              <base-form-item v-if="formData.connectorPluginType === 'custom'" label="插件参数：" prop="connectorPluginParam" class="form-label-width">
                <el-input
                  v-model="formData.connectorPluginParam"
                  type="textarea"
                  placeholder="请输入插件参数，例如：
 'connector.send_alarm_url' = 'http://192.20.10.31:9091/api/alarm/addRecords'"
                  style="width:360px;"
                  :resize="'none'"
                  :rows="4"
                  id="data-sync-modal-send-params" />
              </base-form-item>
              <template v-if="formData.connectorPluginType !== 'custom' && formData.connectorPluginType !== 'do-nothing-connector'">
                <div class="ip-port-box">
                  <span class="form-label">目标端信息：<el-tooltip effect="light" content="请确保目标端已经创建了发送端的所有测点，或已开启自动创建元数据，否则将会导致失败！" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip></span>
                  <div class="ip-port-list">
                    <div class="ip-port-item" v-for="(item, index) in formData.targetInfos" :key="`${index}_host_port`">
                      <base-form-item label="" :prop="`targetInfos[${index}].host`" :rules="requiredRules">
                        <el-input v-model.trim="item.host" placeholder="请输入目标端 IP" style="width: 200px" :id="`data-sync-modal-${index}-host`" />
                      </base-form-item>
                      <span class="ip-port-divider">:</span>
                      <base-form-item label="" :prop="`targetInfos[${index}].port`" :rules="requiredPortRules">
                        <el-input v-model.number="item.port" placeholder="请输入目标端端口号" style="width: 132px" :id="`data-sync-modal-${index}-port`" />
                      </base-form-item>
                      <el-button link v-if="index === 0 && editType !== 'view'" @click="handleAddHost" id="target-ip-add" class="m-l-6" :disabled="isDisabledHosts"><el-icon size="26"><i-custom-add-border /></el-icon></el-button>
                      <el-button link v-if="index !== 0 && editType !== 'view'" @click="handleDelHost(index)" :id="'target-ip-del' + index" class="m-l-6"><el-icon size="26"><i-custom-delete /></el-icon></el-button>
                    </div>
                  </div>
                </div>
                <!-- 单线程数据传输/多线程数据传输 -->
                <div class="flex-align-center" v-if="formData.connectorPluginType === 'iotdb-thrift-sync-connector' || formData.connectorPluginType === 'iotdb-thrift-async-connector' || formData.connectorPluginType === 'iotdb-thrift-connector'">
                  <base-form-item label="攒批发送模式:" prop="isLogSendBatch" :rules="requiredRules" class="form-label-width">
                    <el-switch
                      v-model="formData.isLogSendBatch"
                      :disabled="logSendBatchDisabled"
                      :active-value="true"
                      :inactive-value="false"
                      style="

      --el-switch-on-color: #44C795; --el-switch-off-color: #DFE1ED;"
                      id="data-sync-modal-send-switch"
                    />
                  </base-form-item>
                  <template v-if="formData.isLogSendBatch">
                    <div class="flex-align-center m-l-36">
                      <base-form-item label="等待时间：" prop="logSendBatchWaitTime" :rules="requiredNumberRules" class="form-item-label-short">
                        <template #label>
                          等待时间:<el-tooltip effect="light" content="一批数据在发送前的最长等待时间" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
                        </template>
                        <el-input v-model.number="formData.logSendBatchWaitTime" placeholder="请输入时间" id="data-sync-modal-time" style="width: 100px;" />
                        <span class="m-l-8 form-item-unit">s</span>
                      </base-form-item>
                    </div>
                    <div class="flex-align-center m-l-24">
                      <base-form-item label="攒批大小：" prop="logSendBatchSize" :rules="requiredNumberRules" class="form-item-label-short">
                        <template #label>
                          攒批大小:<el-tooltip effect="light" content="一批数据最大的攒批大小" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
                        </template>
                        <el-input v-model.number="formData.logSendBatchSize" placeholder="请输入大小" id="data-sync-modal-size" style="width: 100px;" />
                        <span class="m-l-8 form-item-unit">byte</span>
                      </base-form-item>
                    </div>
                  </template>
                </div>
                <!-- 向1.1.x以上版本传输 -->
                <template v-if="formData.connectorPluginType === 'iotdb-legacy-pipe-connector'">
                  <base-form-item label="目标端用户名:" prop="targetUserName" :rules="requiredRules" class="form-label-width">
                    <template #label>
                      目标端用户名:<el-tooltip effect="light" content="该用户需要支持数据写入的权限" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
                    </template>
                    <el-input v-model="formData.targetUserName" placeholder="请输入目标端用户名" id="data-sync-modal-targetUserName" style="width: 200px;" />
                  </base-form-item>
                  <base-form-item label="目标端密码:" prop="targetPassword" :rules="requiredRules" class="form-label-width">
                    <el-input v-model="formData.targetPassword" placeholder="请输入目标端密码" id="data-sync-modal-password" style="width: 200px;" show-password autocomplete="off" />
                  </base-form-item>
                  <base-form-item label="目标端版本:" prop="targetVersion" :rules="requiredRules" class="form-label-width">
                    <template #label>
                      目标端版本:<el-tooltip effect="light" content="请输入V1.1.x以上版本" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
                    </template>
                    <el-input v-model="formData.targetVersion" placeholder="请输入目标端版本" id="data-sync-modal-targetVersion" style="width: 200px;" />
                  </base-form-item>
                </template>
                <!-- 跨网闸传输 -->
                <div class="flex-align-center" v-if="formData.connectorPluginType === 'iotdb-air-gap-connector'">
                  <base-form-item label="超时时长：" prop="targetOverTime" :rules="requiredNumberRules" class="form-label-width">
                    <template #label>
                      超时时长:<el-tooltip effect="light" content="发送端与目标端在首次尝试建立连接时握手请求的超时时长" placement="top" popper-class="table-tooltip-max-width"><i-custom-question /></el-tooltip>
                    </template>
                    <el-input v-model.number="formData.targetOverTime" placeholder="请输入目标端超时时长" id="data-sync-modal-time-over" style="width: 200px;" />
                    <span class="m-l-8 form-item-unit">ms</span>
                  </base-form-item>
                </div>
              </template>
            </el-form>
          </el-scrollbar>
        </el-tab-pane>

        <el-tab-pane label="高级输入" name="input">
          <el-scrollbar>
            <code-editor
              v-show="codeMirrorReady"
              v-model:model-value="taskInputVal"
              @ready="codeEditorReady"
              :style="{
                height: `576px`,
                backgroundColor: '#F7F8FC',
              }"
              ref="codeEditorRef"
              :key="codeMirrorKey"
            />
          </el-scrollbar>
        </el-tab-pane>
      </el-tabs>
      <a v-show="activeTab === 'input'" href="https://www.timecho.com/docs/zh/UserGuide/V1.2.x/User-Manual/Data-Sync_timecho.html" rel="noopener noreferrer" target="_blank" class="operate-link"><i-custom-question-new />操作说明</a>
    </div>
    <template #footer>
      <div class="dialog-footer" v-if="editType !== 'view'">
        <el-button @click="handleResetForm" id="data-sync-modal-cancel">重置</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleConfirm" id="data-sync-modal-confirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type {
  FormInstance, SingleOrRange, DateModelType, TabsPaneContext,
} from 'element-plus';
import { DataSyncApi } from '@/api';
import CodeEditor from '@/views/search/components/code-editor.vue';
import {
  getStartAndEnd, today, todayNow, getOneInterval, getOneIntervalNow, formatDate,
} from '@/utils/date';
import ICustomCalender from '~icons/custom/calender.svg';

const props = defineProps<{
  visible: boolean;
  editType: string;
  editData: string;
  editTime: DateModelType;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const formRef = ref<FormInstance>();
const codeEditorRef = ref<InstanceType<typeof CodeEditor>>();
const activeTab = ref('select');
const codeMirrorReady = ref(false);
const codeMirrorKey = ref(0);
const requiredRules = ref([
  {
    required: true,
    message: '请输入内容后操作',
    trigger: ['blur', 'change'],
  },
]);
const requiredNameRules = ref([
  {
    required: true,
    message: '请输入内容后操作',
    trigger: ['blur', 'change'],
  },
  {
    pattern: /^`.*`$|^[A-Za-z0-9_\u4e00-\u9fa5]+$/,
    message: '格式不符，请重新输入',
    trigger: ['blur', 'change'],
  },
]);
const requiredPortRules = ref([
  {
    required: true,
    message: '请输入内容后操作',
    trigger: ['blur', 'change'],
  },
  {
    validator: (rule: any, value: any, callback: any) => {
      if (!/^\+?[1-9][0-9]*$/.test(`${value}`)) {
        return callback(new Error('输入有误'));
      }
      if (value > 65535) {
        return callback(new Error('输入有误'));
      }
      return callback();
    },
    trigger: ['blur', 'change'],
  },
]);
const requiredNumberRules = ref([
  {
    required: true,
    message: '请输入内容后操作',
    trigger: ['blur', 'change'],
  },
  {
    validator: (rule: any, value: any, callback: any) => {
      if (value.toString().indexOf('.') > -1) {
        return callback(new Error('输入有误'));
      }
      if (!/^-?\d+$/.test(`${value}`)) {
        return callback(new Error('输入有误'));
      }
      if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
        return callback(new Error('输入有误'));
      }
      return callback();
    },
    trigger: ['blur', 'change'],
  },
]);
const shortcutsDaterange = [
  {
    text: '今天',
    value: () => getStartAndEnd(0),
  },
  {
    text: '昨天',
    value: () => getOneInterval(1),
  },
  {
    text: '最近7天',
    value: () => getOneIntervalNow(7),
  },
];
const dealOptions = ref<DataSync.PluginData[]>([]);
const sendOptions = ref<DataSync.PluginData[]>([]);
const disabledDate = (time: number) => time > today() || time < new Date('1970-1-1').getTime();
const formData = ref<DataSync.SynchronFormData>({
  name: '',
  whole: true,
  path: '',
  reforward: true,
  isSynchronHistory: true,
  startTime: '' as DateModelType,
  endTime: '' as DateModelType,
  datetimerange: [new Date('1970-1-1').getTime(), props.editTime || todayNow()] as SingleOrRange<DateModelType> as [DateModelType, DateModelType],
  isSynchronRealTime: true,
  triggerMode: 'hybrid',
  // 处理
  processorPluginType: 'do-nothing-processor',
  processorPluginName: '',
  processorPluginParam: '',
  // 发送
  connectorPluginType: 'iotdb-thrift-sync-connector',
  connectorPluginName: '',
  connectorPluginParam: '',
  targetInfos: [{ host: '', port: '' }],
  isLogSendBatch: true,
  logSendBatchWaitTime: '',
  logSendBatchSize: '',
  targetUserName: '',
  targetPassword: '',
  targetVersion: '',
  targetOverTime: '',
});
const taskInputVal = ref('');
const logSendBatchDisabled = ref(false);
const errorName = ref('');
const loading = ref(false);
const saveLoading = ref(false);

const isDisabledHosts = computed(() => {
  const hosts = formData.value.targetInfos;
  const flag = hosts.some((item) => !item.host || !item.port);
  return flag;
});

const { requestFn: getPilePluginsList } = useRequest(DataSyncApi.getPilePluginsList);
const { requestFn: getTaskDetail } = useRequest(DataSyncApi.getTaskDetail);
const { requestFn: getAdvancedTaskDetail } = useRequest(DataSyncApi.getAdvancedTaskDetail);
const { requestFn: saveSynchronTask } = useRequest(DataSyncApi.saveSynchronTask);
const { requestFn: saveAdvancedTask } = useRequest(DataSyncApi.saveAdvancedTask);

function codeEditorReady() {
  codeMirrorReady.value = true;
  codeEditorRef.value?.setCodeEditorReadonly(props.editType === 'view');
}

function handleAddHost() {
  formData.value.targetInfos.push({ host: '', port: '' });
}

function handleDelHost(index: number) {
  formData.value.targetInfos.splice(index, 1);
}

function handleChangeRunningSwitch(val: boolean) {
  if (!val) {
    formData.value.isLogSendBatch = false;
    logSendBatchDisabled.value = true;
  } else if (formData.value.triggerMode === 'file') {
    formData.value.isLogSendBatch = false;
    logSendBatchDisabled.value = true;
  } else {
    logSendBatchDisabled.value = false;
  }
}

function handleChangeTriggerMode(val: 'hybrid' | 'log' | 'file') {
  if (val === 'file') {
    formData.value.isLogSendBatch = false;
    logSendBatchDisabled.value = true;
  } else {
    logSendBatchDisabled.value = false;
  }
}

function handleResetForm() {
  if (activeTab.value === 'select') {
    formRef.value?.resetFields();
    formData.value.name = '';
    formData.value.whole = true;
    formData.value.path = '';
    formData.value.reforward = true;
    formData.value.isSynchronHistory = true;
    formData.value.datetimerange = [new Date('1970-1-1').getTime(), props.editTime];
    formData.value.startTime = new Date('1970-1-1').getTime();
    formData.value.endTime = props.editTime;
    formData.value.isSynchronRealTime = true;
    formData.value.triggerMode = 'hybrid';
    formData.value.processorPluginType = 'do-nothing-processor';
    formData.value.processorPluginName = '';
    formData.value.processorPluginParam = '';
    formData.value.connectorPluginType = 'iotdb-thrift-sync-connector';
    formData.value.connectorPluginName = '';
    formData.value.connectorPluginParam = '';
    formData.value.targetInfos = [{ host: '', port: '' }];
    formData.value.isLogSendBatch = true;
    formData.value.logSendBatchWaitTime = '';
    formData.value.logSendBatchSize = '';
    formData.value.targetUserName = '';
    formData.value.targetPassword = '';
    formData.value.targetVersion = '';
    formData.value.targetOverTime = '';
  } else {
    taskInputVal.value = '';
  }
}

function handleTabClick(tab: TabsPaneContext) {
  if (tab.props.name === 'select') {
    errorName.value = '';
    formRef.value?.clearValidate();
  }
}

function getPlugin() {
  return getPilePluginsList().then((res) => {
    dealOptions.value = res.data.processor || [];
    sendOptions.value = res.data.connector || [];
  });
}

function getSelectDetail() {
  return getTaskDetail(props.editData).then((res) => {
    formData.value = {
      ...res.data,
      path: res.data.whole ? '' : res.data.path.substring(5),
      datetimerange: res.data.startTime && res.data.endTime ? [res.data.startTime, res.data.endTime] : [new Date('1970-1-1').getTime(), props.editTime || todayNow()],
      processorPluginType: res.data.isCustomProcessorPlugin ? 'custom' : res.data.processorPlugin,
      processorPluginName: res.data.isCustomProcessorPlugin ? res.data.processorPlugin : '',
      connectorPluginType: res.data.isCustomConnectorPlugin ? 'custom' : res.data.connectorPlugin,
      connectorPluginName: res.data.isCustomConnectorPlugin ? res.data.connectorPlugin : '',
      targetInfos: res.data.targetInfos || [],
    };
  });
}

function getInputDetail() {
  return getAdvancedTaskDetail(props.editData).then((res) => {
    taskInputVal.value = res.data.advancedInput || '';
  });
}

function getDetail() {
  loading.value = true;
  Promise.allSettled([
    getPlugin(),
    getSelectDetail(),
    getInputDetail(),
  ]).then(() => {
    loading.value = false;
    nextTick(() => {
      formRef.value?.clearValidate();
    });
  });
}

const handleConfirm = () => {
  if (activeTab.value === 'select') {
    errorName.value = '';
    formRef.value?.validate((valid) => {
      if (valid) {
        if (!formData.value.isSynchronHistory && !formData.value.isSynchronRealTime) {
          ElMessage.error('历史数据与实时数据状态不能同时为关，请修改后重新操作');
          return;
        }
        if (formData.value.processorPluginType === 'custom' && formData.value.processorPluginParam.toLocaleLowerCase().includes('processor')) {
          ElMessage.error("插件参数中不能包含 'processor'");
          return;
        }
        if (formData.value.connectorPluginType === 'custom' && formData.value.connectorPluginParam.toLocaleLowerCase().includes('connector')) {
          ElMessage.error("插件参数中不能包含 'connector'");
          return;
        }
        saveLoading.value = true;
        const params = {
          name: formData.value.name,
          whole: formData.value.whole,
          path: formData.value.whole ? 'root' : `root.${formData.value.path}`,
          reforward: formData.value.reforward,
          isSynchronHistory: formData.value.isSynchronHistory,
          startTime: formData.value.isSynchronHistory ? formatDate(formData.value.datetimerange[0], 'YYYY-MM-DD HH:mm:ss.SSSZ') : '',
          endTime: formData.value.isSynchronHistory ? formatDate(formData.value.datetimerange[1], 'YYYY-MM-DD HH:mm:ss.SSSZ') : '',
          isSynchronRealTime: formData.value.isSynchronRealTime,
          triggerMode: formData.value.triggerMode,
          isCustomProcessorPlugin: formData.value.processorPluginType === 'custom',
          processorPlugin: formData.value.processorPluginType === 'custom' ? formData.value.processorPluginName : formData.value.processorPluginType,
          processorPluginParam: formData.value.processorPluginType === 'custom' ? formData.value.processorPluginParam : '',
          isCustomConnectorPlugin: formData.value.connectorPluginType === 'custom',
          connectorPlugin: formData.value.connectorPluginType === 'custom' ? formData.value.connectorPluginName : formData.value.connectorPluginType,
          connectorPluginParam: formData.value.connectorPluginType === 'custom' ? formData.value.connectorPluginParam : '',
          targetInfos: formData.value.connectorPluginType !== 'custom' && formData.value.connectorPluginType !== 'do-nothing-connector' ? formData.value.targetInfos : [],
          isLogSendBatch: formData.value.isLogSendBatch,
          logSendBatchWaitTime: formData.value.isLogSendBatch ? formData.value.logSendBatchWaitTime : '',
          logSendBatchSize: formData.value.isLogSendBatch ? formData.value.logSendBatchSize : '',
          targetUserName: formData.value.connectorPluginType === 'iotdb-legacy-pipe-connector' ? formData.value.targetUserName : '',
          targetPassword: formData.value.connectorPluginType === 'iotdb-legacy-pipe-connector' ? formData.value.targetPassword : '',
          targetVersion: formData.value.connectorPluginType === 'iotdb-legacy-pipe-connector' ? formData.value.targetVersion : '',
          targetOverTime: formData.value.connectorPluginType === 'iotdb-air-gap-connector' ? formData.value.targetOverTime : '',
        };
        saveSynchronTask(params).then(() => {
          ElMessage.success('创建成功');
          dialogVisible.value = false;
          emit('handleSave');
        }).finally(() => {
          saveLoading.value = false;
        }).catch((err) => {
          if (err.code === 1370) {
            errorName.value = err.message;
          }
        });
      } else {
        ElMessage.error('存在必填项未编辑或必填项输入规则有误');
      }
    });
  } else {
    if (!taskInputVal.value || !taskInputVal.value.trim()) {
      ElMessage.error('请输入相应内容后进行操作');
      return;
    }
    saveAdvancedTask(taskInputVal.value).then(() => {
      ElMessage.success('创建成功');
      dialogVisible.value = false;
      emit('handleSave');
    }).finally(() => {
      saveLoading.value = false;
    });
  }
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      codeMirrorReady.value = false;
      codeMirrorKey.value++;
      formRef.value?.resetFields();
      errorName.value = '';
      loading.value = false;
      saveLoading.value = false;
      logSendBatchDisabled.value = false;
      activeTab.value = 'select';
      dealOptions.value = [];
      sendOptions.value = [];
      taskInputVal.value = '';
      handleResetForm();
      if (props.editType === 'view') {
        getDetail();
      } else {
        nextTick(() => {
          formRef.value?.clearValidate();
        });
        loading.value = true;
        getPlugin().finally(() => {
          loading.value = false;
        });
      }
    }
  },
);

</script>

<style lang="scss" scoped>
.form-wrapper{
  position: relative;

  .tabs-tip{
    display: flex;
    align-items: center;
    font-size: 12px;
    line-height: 12px;
    color: #656A85;
    font-weight: 300;
    position: absolute;
    left: 184px;
    top: 6px;
  }

  .operate-link{
    position: absolute;
    left: 0;
    bottom: -28px;
    font-size: 12px;
    font-weight: 300;
    line-height: 12px;
    color: #495AD4;
    display: flex;
    align-items: center;

    svg{
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
  }
}

.form-label-width{
  :deep(.el-form-item__label) {
    width: 120px;

    svg{
      position: relative;
      top: 0;
      right: 0;
      transform: translateY(-100%);
    }
  }
}

.form-item-label-short{
  :deep(.el-form-item__label) {
    width: 84px;
  }
}

.form-item-no-label{
  :deep(.el-form-item__label::before){
    display: none !important;
  }

  :deep(.el-input-group__prepend){
    width: 40px !important;
    padding: 0;
  }
}

.form-item-unit{
  font-size: 12px;
  font-weight: 300;
  line-height: 18px;
  color: #424561;
}

.input-disabled{
  :deep(.el-input__inner){
    color: #131926;
    -webkit-text-fill-color: #131926;
  }

  :deep(.el-input__wrapper){
    box-shadow: none;
  }
}

:deep(.el-tabs__header) {
  margin: 0;
  height: auto;
  border-bottom: none;

  .el-tabs__nav{
    border: none;
  }

  .el-tabs__item{
    padding: 8px 15px !important;
    font-size: 12px;
    font-weight: 300;
    color: #656A85;
    height: 27px;
    border-radius: 6px 6px 0 0;
    background: #FFF;
    border: 1px solid #DFE1ED;

    &:first-child{
      border-left: 1px solid #DFE1ED;
      margin-right: -1px;
    }

    &.is-active{
      border-bottom-color: transparent;
      background-color: #F7F8FC;
      color: #495AD4;
    }
  }
}

:deep(.el-tabs__content){
  background: #F7F8FC;
  border: 1px solid #DFE1ED;
  height: 576px;

  .el-tab-pane {
    height: 576px;
  }
}

.form-module-title{
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  color: #495AD4;
  padding-bottom: 2px;
  border-bottom: 1px solid #DFE1ED;
  margin-bottom: 12px;
}

.radio-tip{
  padding-right: 9px;

  .el-radio__label{
    position: relative;

    svg{
      position: absolute;
      top: 2px;
      right: 0;
    }
  }
}

:deep(.el-switch) {
  height: 28px;
}

:deep(.el-switch__core){
  width: 64px;
  height: 28px;
  border-radius: 14px;
}

:deep(.el-switch__action) {
  width: 24px;
  height: 24px;
}

:deep(.el-switch.is-checked .el-switch__core .el-switch__action) {
  left: calc(100% - 24px);
}

:deep(.el-scrollbar) {
  box-sizing: border-box;
}

.ip-port-box{
  display: flex;

  .form-label{
    height: 28px !important;
    color: #424561 !important;
    font-size: 14px !important;
    font-weight: 400 !important;
    line-height: 21px !important;
    display: inline-flex;
    justify-content: flex-start;
    align-items: center !important;
    flex: 0 0 auto;
    position: relative;
    padding: 0 8px 0 0;
    width: 120px;
    box-sizing: border-box;

    &::before{
      content: "*";
      color: var(--el-color-danger);
      margin-right: 4px;
    }

    svg{
      position: absolute;
      right: 28px;
      top: 0;
    }
  }

  .ip-port-list{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    flex: 1;

    :deep(.el-form-item__label) {
      width: 0 !important;
      padding: 0 !important;
    }
  }

  .ip-port-item{
    display: flex;

    .ip-port-divider{
      width: 28px;
      text-align: center;
      margin-top: 5px;
    }
  }
}
</style>
