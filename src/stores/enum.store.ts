import { defineStore } from 'pinia';
import { AlarmApi } from '@/api';

const { requestFn: getConfigEnum } = useRequest(AlarmApi.getConfigEnum);

export const useEnumStore = defineStore('EnumStore', () => {
  const allEnum = ref<Record<string, ConfigEnumData[]>>({});
  // 布尔类型告警规则
  const alarmBooleanRuleEnum = computed(() => allEnum.value?.ALARM_BOOLEAN_RULE || []);
  // 数值类型告警规则
  const alarmNumberRuleEnum = computed(() => allEnum.value?.ALARM_NUMERICAL_RULE || []);
  // 告警频率
  const alarmFrequencyEnum = computed(() => allEnum.value?.ALARM_FREQUENCY || []);
  // 告警等级
  const alarmLevelEnum = computed(() => allEnum.value?.ALARM_LEVEL || []);

  function loadAllEnum() {
    getConfigEnum().then((res) => {
      allEnum.value = res.data;
    });
  }

  return {
    allEnum,
    loadAllEnum,
    alarmBooleanRuleEnum,
    alarmNumberRuleEnum,
    alarmFrequencyEnum,
    alarmLevelEnum,
  };
}, {
  persist: {
    storage: sessionStorage,
    afterRestore: (context) => {
      if (!context.store.allEnum || Object.keys(context.store.allEnum).length === 0) {
        context.store.loadAllEnum();
      }
    },
  },
});

export default useEnumStore;
