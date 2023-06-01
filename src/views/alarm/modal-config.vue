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
              @change="handleChangePath"
            >
              <el-option v-for="item in measurementList" :key="item.timeseries" :label="item.timeseries" :value="item.timeseries" />
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
            <el-select v-model="formData.alarmRulesType">
              <el-option label="毫秒" value="millisecond" />
              <el-option label="秒" value="second" />
              <el-option label="分" value="minute" />
              <el-option label="小时" value="hour" />
              <el-option label="天" value="day" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="持续时间:" prop="alarmDuration" :rules="requiredRules">
            <el-input v-model="formData.alarmDuration">
              <template #append>
                <el-select v-model="formData.alarmDurationType" style="width: 100px;" clearable placeholder="">
                  <el-option label="毫秒" value="millisecond" />
                  <el-option label="秒" value="second" />
                  <el-option label="分" value="minute" />
                  <el-option label="小时" value="hour" />
                  <el-option label="天" value="day" />
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
              <el-option label="毫秒" value="millisecond" />
              <el-option label="秒" value="second" />
              <el-option label="分" value="minute" />
              <el-option label="小时" value="hour" />
              <el-option label="天" value="day" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="告警频率:" prop="alarmFrequency" :rules="requiredRules">
            <el-select v-model="formData.alarmFrequency">
              <el-option label="毫秒" value="millisecond" />
              <el-option label="秒" value="second" />
              <el-option label="分" value="minute" />
              <el-option label="小时" value="hour" />
              <el-option label="天" value="day" />
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

const formRef = ref<FormInstance>();
const requiredRules = ref([
  {
    required: true,
    message: '请输入相应内容后进行操作',
    trigger: 'change',
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
const measurementList = ref<StorageDevice.MeasurementDataItem[]>([]);
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
  getAlarmConfigDetail(props.alarmConfId).then((res) => {
    assign(formData, res.data);
  });
}

function handleChangePath(val: string) {
  const current = measurementList.value.find((f) => f.timeseries === val);
  formData.measurementType = current?.dataType;
}

/**
 * new/edit storage
 */
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
      if (props.editType === 'edit') {
        formData.alarmConfId = props.alarmConfId;
        getDetail();
      } else {
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
</style>
