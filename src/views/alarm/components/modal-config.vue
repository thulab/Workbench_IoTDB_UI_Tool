<template>
  <el-dialog
    :title="editType === 'add' ? '新建告警' : '编辑告警'"
    v-model="dialogVisible"
    width="718px"
    class="new-storage-container"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" class="source-form" label-position="right" label-width="90px">
      <el-row>
        <el-col :span="12">
          <base-form-item label="告警序列：" prop="measurement" :rules="editType === 'add' ? requiredRules : []">
            <template #label>
              告警序列：<el-tooltip effect="light" content="关键字搜索仅展示100条搜索结果，如有需要请精确搜索" placement="top"><i-custom-question /></el-tooltip>
            </template>
            <el-select
              v-model="formData.measurement"
              placeholder="请输入告警序列"
              filterable
              remote
              remote-show-suffix
              :remote-method="remoteMethod"
              :loading="measurementLoading"
              :disabled="editType === 'edit'"
              @change="handleChangePath"
              style="width: 235px;"
            >
              <el-option v-for="item in measurementList" :key="item.timeseries" :label="item.timeseries" :value="item.timeseries" :disabled="item.dataType === 'TEXT'" />
            </el-select>
          </base-form-item>
        </el-col>
        <el-col :span="12">
          <base-form-item label="数据类型：" prop="measurementType" class="m-l-45 type-input-disabled">
            <el-input v-model="formData.measurementType" disabled style="width: 80px;" />
          </base-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <base-form-item label="告警名称：" prop="alarmName" :rules="requiredRules">
            <el-input v-model="formData.alarmName" show-word-limit maxlength="20" placeholder="请输入告警名称" />
          </base-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <base-form-item label="告警规则：" prop="alarmRulesType" :rules="requiredRulesRules">
            <el-select
              v-if="formData.measurementType === 'BOOLEAN' || !formData.measurementType"
              v-model="formData.alarmRulesType"
              :disabled="!formData.measurementType"
              @change="handleChangeBooleanRule"
              style="width: 235px;"
              placeholder="未选择"
            >
              <el-option
                v-for="item in booleanRuleEnum"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              />
            </el-select>
            <div v-else class="number-rule-box">
              <el-select v-model="formData.alarmRulesType" :disabled="!formData.measurementType" style="width: 114px;" class="m-r-8">
                <el-option
                  v-for="item in numberRuleEnum"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value"
                />
              </el-select>
              <el-input v-model="formData.alarmRulesTypeVal" :disabled="!formData.measurementType" placeholder="请输入" style="width: 114px;" />
            </div>
          </base-form-item>
        </el-col>
        <el-col :span="12">
          <base-form-item label="持续时间：" prop="alarmDuration" :rules="requiredDurationRules" class="m-l-45">
            <el-input
              v-model.number="formData.alarmDuration"
              :disabled="changeBoolean"
              placeholder="请输入持续时间"
              style="width: 235px;"
            >
              <template #append>
                <el-select
                  v-model="formData.alarmDurationType"
                  :disabled="changeBoolean"
                  style="width: 56px;"
                  placeholder=" "
                >
                  <el-option label="ms" value="ms" />
                  <el-option label="s" value="s" />
                  <el-option label="min" value="min" />
                  <el-option label="h" value="h" />
                </el-select>
              </template>
            </el-input>
          </base-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <base-form-item prop="alarmLevel" :rules="requiredRules" :style="{ color: getLevelColor }">
            <template #label>
              告警级别：<el-tooltip effect="light" content="一级为最高级别告警，二级次之，依次递减" placement="top"><i-custom-question /></el-tooltip>
            </template>
            <el-select v-model="formData.alarmLevel" style="width: 235px;" class="level-select-box">
              <template #prefix>
                <el-icon v-if="formData.alarmLevel" :style="{ color: getLevelColor }" size="20"><i-custom-alarm-level /></el-icon>
              </template>
              <el-option
                v-for="item in levelEnum"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              >
                <span style="display: flex; align-items: center;">
                  <el-icon size="20" :style="{ color: item.paramMap?.color }"><i-custom-alarm-level /></el-icon>
                  <span :style="{ color: item.paramMap?.color }">{{ item.name }}</span>
                </span>
              </el-option>
            </el-select>
          </base-form-item>
        </el-col>
        <el-col :span="12">
          <base-form-item label="告警频率：" prop="alarmFrequency" :rules="changeBoolean ? [] : requiredRules" class="m-l-45">
            <el-select
              v-model="formData.alarmFrequency"
              :disabled="changeBoolean"
              style="width: 235px;"
            >
              <el-option
                v-for="item in frequencyEnum"
                :key="item.value"
                :label="item.name"
                :value="item.value"
              />
            </el-select>
          </base-form-item>
        </el-col>
      </el-row>
      <el-row class="m-b-12">
        <el-col :span="24">
          <base-form-item label="告警说明：" prop="alarmDesc">
            <el-input type="textarea" v-model="formData.alarmDesc" show-word-limit maxlength="100" placeholder="请输入告警说明" :resize="'none'" class="alarm-desc-textarea" />
          </base-form-item>
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
import { storeToRefs } from 'pinia';
import { AlarmApi, StorageApi } from '@/api';
import { useEnumStore } from '@/stores';

const props = defineProps<{
  serverId: number;
  visible: boolean;
  editType: string;
  alarmConfigId?: number;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave',): void;
}>();

const dialogVisible = useVModel(props, 'visible', emit);
const enumStore = useEnumStore();
const {
  alarmBooleanRuleEnum: booleanRuleEnum,
  alarmNumberRuleEnum: numberRuleEnum,
  alarmLevelEnum: levelEnum,
  alarmFrequencyEnum: frequencyEnum,
} = storeToRefs(enumStore);
const formRef = ref<FormInstance>();

const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: ['blur', 'change'],
  },
]);

const formData = reactive<Alarm.ConfigData>({
  alarmConfigId: undefined,
  alarmName: '',
  measurement: '',
  measurementType: '',
  alarmLevel: '',
  alarmDesc: '',
  alarmRulesType: '',
  alarmRulesTypeVal: undefined,
  alarmFrequency: '',
  alarmDuration: undefined,
  alarmDurationType: '',
});
const measurementList = ref<StorageDevice.MeasurementDataItem[]>([]);

const changeBoolean = computed(() => formData.measurementType === 'BOOLEAN' && formData.alarmRulesType === 'change');

const checkRules = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error('请选择告警规则条件'));
  }
  if (formData.measurementType !== 'BOOLEAN') {
    if (!formData.alarmRulesTypeVal) {
      return callback(new Error('请输入告警规则值'));
    }
    if (!/^(-?\d+)(\.\d+)?$/.test(formData.alarmRulesTypeVal)) {
      return callback(new Error('告警规则值只能为数字'));
    }
    if (+formData.alarmRulesTypeVal > Number.MAX_SAFE_INTEGER || +formData.alarmRulesTypeVal < Number.MIN_SAFE_INTEGER) {
      return callback(new Error('告警规则值超过最大值范围，请修改'));
    }

    return callback();
  }
  return callback();
};

const requiredRulesRules = ref([
  {
    required: true,
    message: '请选择告警规则条件',
    trigger: ['blur', 'change'],
  },
  {
    validator: checkRules,
    trigger: ['blur', 'change'],
  },
]);

const checkDuration = (rule: any, value: any, callback: any) => {
  if (!value && value !== 0) {
    return callback(new Error('请输入相应内容后进行操作'));
  }
  if (!/^\d+$/.test(`${value}`)) {
    return callback(new Error('只能输入正整数或0'));
  }
  if (typeof value === 'number' && value > 100000000) {
    formData.alarmDuration = 100000000;
    // return callback(new Error(`最大值为${100000000}`));
  }
  if ((formData.measurementType === 'BOOLEAN' && formData.alarmRulesType !== 'change' && !formData.alarmDurationType) || (formData.measurementType !== 'BOOLEAN' && !formData.alarmDurationType)) {
    return callback(new Error('请选择持续时间单位'));
  }
  return callback();
};

const requiredDurationRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: ['blur', 'change'],
  },
  {
    validator: checkDuration,
    trigger: ['blur', 'change'],
  },
]);

const getLevelColor = computed(() => {
  if (formData.alarmLevel) {
    const res = levelEnum.value.find((f: ConfigEnumData) => f.value === formData.alarmLevel);
    return res?.paramMap?.color;
  }
  return '#656A85';
});

const { requestFn: saveAlarmConfig } = useRequest(AlarmApi.saveAlarmConfig);
const { requestFn: updateAlarmConfig } = useRequest(AlarmApi.updateAlarmConfig);
const { requestFn: getAlarmConfigDetail } = useRequest(AlarmApi.getAlarmConfigDetail);
const { requestFn: getMeasurement, loading: measurementLoading } = useRequest(StorageApi.getMeasurementAllObjList);

let lastMeasurementQuery = '';
const remoteMethod = debounce((query: string) => {
  lastMeasurementQuery = query;
  getMeasurement(props.serverId, lastMeasurementQuery).then((res) => {
    if (lastMeasurementQuery === query) {
      measurementList.value = res.data?.measurements?.map((item) => item) || [];
    }
  });
}, 500);

function getDetail() {
  if (!props.alarmConfigId) return;
  getAlarmConfigDetail(props.alarmConfigId).then((res) => {
    assign(formData, res.data);
    if (res.data.alarmRules?.length) {
      formData.alarmRulesType = res.data.alarmRules[0].operator;
      formData.alarmRulesTypeVal = res.data.alarmRules[0].value;
    }
  });
}

function handleChangePath(val: string) {
  const current = measurementList.value.find((f) => f.timeseries === val);
  formData.measurementType = current?.dataType;
  formData.alarmName = '';
  formData.alarmLevel = '';
  formData.alarmDesc = '';
  formData.alarmRulesType = '';
  formData.alarmRulesTypeVal = undefined;
  formData.alarmFrequency = '';
  formData.alarmDuration = undefined;
  formData.alarmDurationType = '';
}

function handleChangeBooleanRule(val: string) {
  if (val === 'change') {
    formData.alarmDuration = 0;
    formData.alarmDurationType = '';
    formData.alarmFrequency = '';
  }
}

const handleConfirm = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      const params = {
        alarmName: formData.alarmName,
        alarmLevel: formData.alarmLevel,
        alarmDesc: formData.alarmDesc,
        alarmFrequency: formData.alarmFrequency,
        alarmDuration: formData.alarmDuration,
        alarmDurationType: formData.alarmDurationType,
        alarmRules: [{ operator: formData.alarmRulesType, value: formData.alarmRulesTypeVal }],
      };
      if (props.editType === 'add') {
        saveAlarmConfig({
          ...params,
          measurement: formData.measurement,
          measurementType: formData.measurementType,
        }).then((res) => {
          if (res.code === 0) {
            ElMessage.success('新建告警成功');
            dialogVisible.value = false;
            emit('handleSave');
          }
        });
      } else {
        updateAlarmConfig({
          ...params,
          alarmConfigId: props.alarmConfigId,
        }).then((res) => {
          if (res.code === 0) {
            ElMessage.success('编辑告警成功');
            dialogVisible.value = false;
            emit('handleSave');
          }
        });
      }
    } else {
      ElMessage.error('存在必填项未编辑或必填项输入规则有误');
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      formRef.value?.resetFields();
      formData.alarmRulesType = '';
      formData.alarmRulesTypeVal = undefined;
      formData.alarmDuration = undefined;
      formData.alarmDurationType = '';
      if (props.editType === 'edit') {
        formData.alarmConfigId = props.alarmConfigId;
        getDetail();
      } else {
        formData.alarmConfigId = undefined;
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

.level-select-box{
  :deep(.el-input__inner) {
    color: unset;
  }
}

.type-input-disabled{
  :deep(.el-input__inner){
    color: #131926;
    -webkit-text-fill-color: #131926;
  }

  :deep(.el-input__wrapper){
    box-shadow: none;
  }
}

.alarm-desc-textarea{
  :deep(.el-textarea__inner) {
    height: 72px;
  }
}
</style>
