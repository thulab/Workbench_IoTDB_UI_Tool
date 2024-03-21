<template>
  <el-dialog
    :title="editType === 'add' ? t('alarm.newAlarm') : t('alarm.editAlarm')"
    v-model="dialogVisible"
    width="900px"
    class="new-storage-container"
    align-center
    :close-on-click-modal="false"
    id="alarm-config-modal"
  >
    <el-form ref="formRef" :model="formData" class="source-form" label-position="right" :label-width="locale === 'en' ? '166px' : '98px'">
      <el-row>
        <el-col :span="12">
          <base-form-item prop="measurement" :rules="editType === 'add' ? requiredRules : []">
            <template #label>
              {{ t('alarm.alarmMeasurement') }}：
              <el-tooltip v-if="editType === 'add'" effect="light" :content="t('common.searchAllTipLimit100')" placement="bottom" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
            </template>
            <timeseries-select-single
              id="alarm-config-modal-measurement"
              ref="timeseriesSelectSingleRef"
              v-model="formData.measurement"
              :selectWidth="250"
              :itemWidth="220"
              show-suffix
              :key="dialogKey"
              :filter-system="true"
              :disabled-select="editType === 'edit'"
              :disabled-path="(item) => item.dataType === 'TEXT' || item.viewType === 'VIEW'"
              @handleChangePath="handleChangePath"
            />
          </base-form-item>
        </el-col>
        <el-col :span="12">
          <base-form-item :label="`${t('measurement.dataType')}：`" prop="measurementType" class="m-l-45 type-input-disabled">
            <el-input v-model="formData.measurementType" disabled style="width: 80px" id="alarm-config-modal-measurementType" />
          </base-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <base-form-item :label="`${t('alarm.alarmName')}：`" prop="alarmName" :rules="requiredRules">
            <el-input v-model="formData.alarmName" show-word-limit maxlength="20" :placeholder="t('alarm.alarmNamePlaceholder')" id="alarm-config-modal-name" />
          </base-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <base-form-item :label="`${t('alarm.alarmRules')}：`" prop="alarmRulesType" :rules="requiredRulesRules" class="alarm-rule-error">
            <el-select
              v-if="formData.measurementType === 'BOOLEAN' || !formData.measurementType"
              v-model="formData.alarmRulesType"
              :disabled="!formData.measurementType"
              @change="handleChangeBooleanRule"
              style="width: 250px"
              :placeholder="t('common.selectPlaceholder')"
              id="alarm-config-modal-rule-BOOLEAN"
            >
              <el-option v-for="item in booleanRuleEnum" :key="item.value" :label="item.name" :value="item.value" :id="`alarm-config-modal-rule-BOOLEAN-select-${item.value}`" />
            </el-select>
            <div v-else class="number-rule-box">
              <el-select v-model="formData.alarmRulesType" :disabled="!formData.measurementType" style="width: 121px" class="m-r-8" id="alarm-config-modal-rule">
                <el-option v-for="item in numberRuleEnum" :key="item.value" :label="item.name" :value="item.value" :id="`alarm-config-modal-rule-select-${item.value}`" />
              </el-select>
              <el-input v-model="formData.alarmRulesTypeVal" :disabled="!formData.measurementType" :placeholder="t('common.placeHolder')" style="width: 121px" id="alarm-config-modal-rule-val" />
            </div>
          </base-form-item>
        </el-col>
        <el-col :span="12">
          <base-form-item :label="`${t('alarm.duration')}：`" prop="alarmDuration" :rules="requiredDurationRules" class="m-l-45">
            <el-input v-model.number="formData.alarmDuration" :disabled="changeBoolean" :placeholder="t('alarm.durationPlaceholder')" id="alarm-config-modal-duration">
              <template #append>
                <el-select v-model="formData.alarmDurationType" :disabled="changeBoolean" style="width: 70px" placeholder=" " id="alarm-config-modal-duration-unit">
                  <el-option label="ms" value="ms" id="alarm-config-modal-duration-unit-ms" />
                  <el-option label="s" value="s" id="alarm-config-modal-duration-unit-s" />
                  <el-option label="min" value="min" id="alarm-config-modal-duration-unit-min" />
                  <el-option label="h" value="h" id="alarm-config-modal-duration-unit-h" />
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
              {{ t('alarm.alarmLevel') }}：
              <el-tooltip effect="light" :content="t('alarm.alarmLevelTip')" placement="bottom" popper-class="tooltip-box-width"><i-custom-question /></el-tooltip>
            </template>
            <el-select v-model="formData.alarmLevel" style="width: 250px" class="level-select-box" id="alarm-config-modal-level">
              <template #prefix>
                <el-icon v-if="formData.alarmLevel" :style="{ color: getLevelColor }" size="20"><i-custom-alarm-level /></el-icon>
              </template>
              <el-option v-for="item in levelEnum" :key="item.value" :label="item.name" :value="item.value" :id="`alarm-config-modal-level-select-${item.value}`">
                <span style="display: flex; align-items: center">
                  <el-icon size="20" :style="{ color: item.paramMap?.color }"><i-custom-alarm-level /></el-icon>
                  <span :style="{ color: item.paramMap?.color }">{{ item.name }}</span>
                </span>
              </el-option>
            </el-select>
          </base-form-item>
        </el-col>
        <el-col :span="12">
          <base-form-item :label="`${t('alarm.frequency')}：`" prop="alarmFrequency" :rules="requiredRules" class="m-l-45">
            <el-select v-model="formData.alarmFrequency" :disabled="changeBoolean" id="alarm-config-modal-frequency">
              <el-option v-for="item in frequencyEnum" :key="item.value" :label="item.name" :value="item.value" :id="`alarm-config-modal-frequency-select-${item.value}`" />
            </el-select>
          </base-form-item>
        </el-col>
      </el-row>
      <el-row class="m-b-12">
        <el-col :span="24">
          <base-form-item :label="`${t('alarm.alarmIntro')}：`" prop="alarmDesc">
            <el-input
              type="textarea"
              v-model="formData.alarmDesc"
              show-word-limit
              maxlength="100"
              :placeholder="t('alarm.alarmIntroPlaceholder')"
              :resize="'none'"
              class="alarm-desc-textarea"
              id="alarm-config-modal-desc"
            />
          </base-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false" id="alarm-config-modal-cancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleConfirm" id="alarm-config-modal-confirm">{{ t('common.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { assign } from 'lodash-es';
import type { FormInstance } from 'element-plus';
import { storeToRefs } from 'pinia';
import { AlarmApi } from '@/api';
import { useEnumStore } from '@/stores';
import TimeseriesSelectSingle from '@/components/timeseries-select-single.vue';

const props = defineProps<{
  visible: boolean;
  editType: string;
  alarmConfigId?: number;
}>();

const emit = defineEmits<{
  (event: 'update:visible', visible: boolean): void;
  (event: 'handleSave'): void;
}>();

const { t, locale } = useI18n();
const dialogVisible = useVModel(props, 'visible', emit);
const timeseriesSelectSingleRef = ref<InstanceType<typeof TimeseriesSelectSingle>>();
const enumStore = useEnumStore();
const { alarmBooleanRuleEnum: booleanRuleEnum, alarmNumberRuleEnum: numberRuleEnum, alarmLevelEnum: levelEnum, alarmFrequencyEnum: frequencyEnum } = storeToRefs(enumStore);
const formRef = ref<FormInstance>();

const requiredRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
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
  alarmFrequency: 'ONCE',
  alarmDuration: 0,
  alarmDurationType: 'ms',
});
const dialogKey = ref(0);

const changeBoolean = computed(() => formData.measurementType === 'BOOLEAN' && formData.alarmRulesType === 'change');

const checkRules = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error(t('common.formRuleEmptyOperateShort')));
  }
  if (formData.measurementType !== 'BOOLEAN') {
    if (!formData.alarmRulesTypeVal) {
      return callback(new Error(t('alarm.booleanRule')));
    }
    if (!/^(-?\d+)(\.\d+)?$/.test(formData.alarmRulesTypeVal)) {
      return callback(new Error(t('alarm.numberRule')));
    }
    if (+formData.alarmRulesTypeVal > Number.MAX_SAFE_INTEGER || +formData.alarmRulesTypeVal < Number.MIN_SAFE_INTEGER) {
      return callback(new Error(t('alarm.numberOverRule')));
    }

    return callback();
  }
  return callback();
};

const requiredRulesRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
    trigger: ['blur', 'change'],
  },
  {
    validator: checkRules,
    trigger: ['blur', 'change'],
  },
]);

const checkDuration = (rule: any, value: any, callback: any) => {
  if (!value && value !== 0) {
    return callback(new Error(t('common.formRuleEmptyOperateShort')));
  }
  if (!/^\d+$/.test(`${value}`)) {
    return callback(new Error(t('alarm.intRule')));
  }
  if (typeof value === 'number' && value > 100000000) {
    formData.alarmDuration = 100000000;
    // return callback(new Error(`最大值为${100000000}`));
  }
  if ((formData.measurementType === 'BOOLEAN' && formData.alarmRulesType !== 'change' && !formData.alarmDurationType) || (formData.measurementType !== 'BOOLEAN' && !formData.alarmDurationType)) {
    return callback(new Error(t('alarm.durationRule')));
  }
  return callback();
};

const requiredDurationRules = ref([
  {
    required: true,
    message: () => t('common.formRuleEmptyOperateShort'),
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
  return '#424561';
});

const { requestFn: saveAlarmConfig } = useRequest(AlarmApi.saveAlarmConfig);
const { requestFn: updateAlarmConfig } = useRequest(AlarmApi.updateAlarmConfig);
const { requestFn: getAlarmConfigDetail } = useRequest(AlarmApi.getAlarmConfigDetail);

function getDetail() {
  if (!props.alarmConfigId) return;
  getAlarmConfigDetail(props.alarmConfigId).then((res) => {
    assign(formData, res.data);
    if (res.data.alarmRules?.length) {
      formData.alarmRulesType = res.data.alarmRules[0].operator;
      formData.alarmRulesTypeVal = res.data.alarmRules[0].value;
    }
    if (!res.data.alarmFrequency) {
      formData.alarmFrequency = 'ONCE';
    }
  });
}

function handleChangePath(val: string, data: StorageDevice.MeasurementDataItem[]) {
  formRef.value?.resetFields();
  formData.alarmRulesTypeVal = undefined;
  formData.alarmDurationType = 'ms';
  const current = data.find((f) => f.timeseries === val);
  formData.measurement = val;
  formData.measurementType = current?.dataType;
}

function handleChangeBooleanRule(val: string) {
  if (val === 'change') {
    formData.alarmDuration = 0;
    formData.alarmDurationType = 'ms';
    formData.alarmFrequency = 'ONCE';
    formRef.value?.clearValidate('alarmDuration');
    formRef.value?.clearValidate('alarmFrequency');
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
            ElMessage.success(t('alarm.newSuccess'));
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
            ElMessage.success(t('alarm.editSuccess'));
            dialogVisible.value = false;
            emit('handleSave');
          }
        });
      }
    } else {
      ElMessage.error(t('common.errorEmptyTip'));
    }
  });
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      dialogKey.value++;
      formRef.value?.resetFields();
      formData.alarmRulesType = '';
      formData.alarmRulesTypeVal = undefined;
      formData.alarmDuration = 0;
      formData.alarmDurationType = 'ms';
      formData.alarmFrequency = 'ONCE';
      if (props.editType === 'edit') {
        formData.alarmConfigId = props.alarmConfigId;
        getDetail();
      } else {
        formData.alarmConfigId = undefined;
      }
    }
  }
);
</script>

<style scoped lang="scss">
.new-storage-container {
  position: relative;
}

.number-rule-box {
  display: flex;
}

.level-select-box {
  :deep(.el-input__inner) {
    color: unset;
  }
}

.type-input-disabled {
  :deep(.el-input__inner) {
    color: #131926;
    -webkit-text-fill-color: #131926;
  }

  :deep(.el-input__wrapper) {
    box-shadow: none;
  }

  :deep(.el-form-item__label::before) {
    content: '*';
    color: var(--el-color-danger);
    margin-right: 4px;
  }
}

.alarm-desc-textarea {
  :deep(.el-textarea__inner) {
    height: 72px;
  }
}

.alarm-rule-error.is-error {
  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-color-danger) inset !important;
  }
}
</style>
