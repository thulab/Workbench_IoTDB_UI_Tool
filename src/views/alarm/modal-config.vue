<template>
  <el-dialog
    :title="editType === 'add' ? '新建告警' : '编辑告警'"
    v-model="dialogVisible"
    width="800px"
    class="new-storage-container"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" class="source-form" label-position="right" label-width="120px">
      <el-row>
        <el-col :span="12">
          <el-form-item label="告警序列:" prop="measurement" :rules="requiredRules">
            <template #label>
              告警序列:<el-tooltip effect="light" content="关键字搜索仅展示100条搜索结果，如有需要请精确搜索" placement="top"><i-custom-question /></el-tooltip>
            </template>
            <el-select
              v-model="formData.measurement"
              placeholder="请选择告警序列"
              filterable
              remote
              remote-show-suffix
              :remote-method="remoteMethod"
              :loading="measurementLoading"
              :disabled="editType === 'edit'"
              @change="handleChangePath"
            >
              <el-option v-for="item in measurementList" :key="item.timeseries" :label="item.timeseries" :value="item.timeseries" :disabled="item.dataType === 'TEXT'" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="数据类型:" prop="measurementType" :rules="requiredRules">
            <el-input v-model="formData.measurementType" disabled />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="告警名称:" prop="alarmName" :rules="requiredRules">
            <el-input v-model="formData.alarmName" show-word-limit maxlength="20" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="告警规则:" prop="alarmRulesType" :rules="requiredRules">
            <el-select v-if="formData.measurementType === 'BOOLEAN' || !formData.measurementType" v-model="formData.alarmRulesType" :disabled="!formData.measurementType" @change="handleChangeBooleanRule">
              <el-option
                v-for="item in booleanRuleEnum"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              />
            </el-select>
            <div v-else class="number-rule-box">
              <el-select v-model="formData.alarmRulesType" :disabled="!formData.measurementType">
                <el-option
                  v-for="item in numberRuleEnum"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value"
                />
              </el-select>
              <el-input v-model="formData.alarmRulesTypeVal" :disabled="!formData.measurementType" />
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="持续时间:" prop="alarmDuration" :rules="requiredRules">
            <el-input v-model="formData.alarmDuration" :disabled="formData.measurementType === 'BOOLEAN' && formData.alarmRulesType === 'ONE'">
              <template #append>
                <el-select v-model="formData.alarmDurationType" style="width: 100px;" :disabled="formData.measurementType === 'BOOLEAN' && formData.alarmRulesType === 'ONE'">
                  <el-option label="ms" value="ms" />
                  <el-option label="s" value="s" />
                  <el-option label="min" value="min" />
                  <el-option label="h" value="h" />
                </el-select>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item prop="alarmLevel" :rules="requiredRules">
            <template #label>
              告警级别:<el-tooltip effect="light" content="一级为最高级别告警，二级次之，依次递减" placement="top"><i-custom-question /></el-tooltip>
            </template>
            <el-select v-model="formData.alarmLevel">
              <el-option
                v-for="item in levelEnum"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="告警频率:" prop="alarmFrequency" :rules="requiredRules">
            <el-select v-model="formData.alarmFrequency">
              <el-option
                v-for="item in frequencyEnum"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="告警说明:" prop="alarmDesc">
            <el-input type="textarea" v-model="formData.alarmDesc" show-word-limit maxlength="100" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { debounce, assign } from 'lodash-es';
import type { FormInstance } from 'element-plus';
import { AlarmApi, StorageApi } from '@/api';
import { useEnumStore } from '@/stores';

const props = defineProps<{
  serverId: number;
  visible: boolean;
  editType: string;
  alarmConfId?: number;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const enumStore = useEnumStore();
const booleanRuleEnum = enumStore.alarmBooleanRuleEnum;
const numberRuleEnum = enumStore.alarmNumberRuleEnum;
const levelEnum = enumStore.alarmLevelEnum;
const frequencyEnum = enumStore.alarmFrequencyEnum;
const formRef = ref<FormInstance>();
const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: ['blur', 'change'],
  },
]);
const formData = reactive<Alarm.ConfigData>({
  alarmConfId: undefined,
  alarmName: '',
  measurement: '',
  measurementType: '',
  alarmLevel: '',
  alarmDesc: '',
  alarmRulesType: '',
  alarmRulesTypeVal: '',
  alarmFrequency: '',
  alarmDuration: '',
  alarmDurationType: '',
});
// const measurementList = ref<StorageDevice.MeasurementDataItem[]>([]);
const measurementList = ref<StorageDevice.MeasurementItem[]>([]);
const { requestFn: saveAlarmConfig } = useRequest(AlarmApi.saveAlarmConfig);
const { requestFn: updateAlarmConfig } = useRequest(AlarmApi.updateAlarmConfig);
const { requestFn: getAlarmConfigDetail } = useRequest(AlarmApi.getAlarmConfigDetail);
// const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementAllObjList);
const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementsInfosByFuzzy);

let lastMeasurementQuery = '';
const remoteMethod = debounce((query: string) => {
  lastMeasurementQuery = query;
  // getMeasurement(props.serverId, lastMeasurementQuery).then((res) => {
  //   if (lastMeasurementQuery === query) {
  //     measurementList.value = res.data?.measurements?.map((item) => item) || [];
  //   }
  // });
  getMeasurement(props.serverId, {
    dataBaseOrDevice: 'database',
    pathName: 'root.naigai',
    keyword: lastMeasurementQuery,
    pageNum: 1,
    pageSize: 100,
  }).then((res) => {
    measurementList.value = res.data?.measurements;
  });
}, 500);

function getDetail() {
  if (!props.alarmConfId) return;
  getAlarmConfigDetail(props.alarmConfId).then((res) => {
    assign(formData, res.data);
    // formData.alarmRulesType = '';
    // formData.alarmRulesTypeVal = '';
  });
}

function handleChangePath(val: string) {
  const current = measurementList.value.find((f) => f.timeseries === val);
  formData.measurementType = current?.dataType;
  formData.alarmName = '';
  formData.alarmLevel = '';
  formData.alarmDesc = '';
  formData.alarmRulesType = '';
  formData.alarmRulesTypeVal = '';
  formData.alarmFrequency = '';
  formData.alarmDuration = '';
  formData.alarmDurationType = '';
}

function handleChangeBooleanRule(val: string) {
  if (val === 'ONE') {
    formData.alarmDuration = '0';
  }
}

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (props.editType === 'add') {
        saveAlarmConfig({
          ...formData,
        }).then((res) => {
          if (res.code === 0) {
            ElMessage.success('新建告警成功');
            dialogVisible.value = false;
            emit('handleSave');
          }
        });
      } else {
        updateAlarmConfig({
          ...formData,
        }).then((res) => {
          if (res.code === 0) {
            ElMessage.success('编辑告警成功');
            dialogVisible.value = false;
            emit('handleSave');
          }
        });
      }
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formData.alarmRulesType = '';
      formData.alarmRulesTypeVal = '';
      formData.alarmDuration = '';
      formData.alarmDurationType = '';
      if (props.editType === 'edit') {
        formData.alarmConfId = props.alarmConfId;
        getDetail();
      } else {
        formData.alarmConfId = undefined;
        remoteMethod('');
      }
    }
  },
);

</script>

<style scoped lang="scss">

.new-storage-container{
  position: relative;
}

.number-rule-box{
  display: flex;
}
</style>
