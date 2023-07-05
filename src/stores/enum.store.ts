import { defineStore } from 'pinia';
import { AlarmApi } from '@/api';

const { requestFn: getConfigEnum } = useRequest(AlarmApi.getConfigEnum);

export const useEnumStore = defineStore('EnumStore', () => {
  const allEnum = ref<Record<string, ConfigEnumData[]>>({});
  // 布尔类型告警规则
  const alarmBooleanRuleEnum = computed(() => allEnum.value?.ALARM_BOOLEAN_RULE || [
    {
      value: 'change0',
      name: '变0告警',
      paramMap: null,
    },
    {
      value: 'change1',
      name: '变1告警',
      paramMap: null,
    },
    {
      value: 'change',
      name: '变化告警',
      paramMap: null,
    },
  ]);
  // 数值类型告警规则
  const alarmNumberRuleEnum = computed(() => allEnum.value?.ALARM_NUMERICAL_RULE || [
    {
      value: 'GREATER_THAN',
      name: '大于',
      paramMap: null,
    },
    {
      value: 'LESS_THAN',
      name: '小于',
      paramMap: null,
    },
    {
      value: 'GREATER_THAN_OR_EQUAL',
      name: '大于等于',
      paramMap: null,
    },
    {
      value: 'LESS_THAN_OR_EQUAL',
      name: '小于等于',
      paramMap: null,
    },
    {
      value: 'EQUAL',
      name: '等于',
      paramMap: null,
    },
    {
      value: 'NOT_EQUAL',
      name: '不等于',
      paramMap: null,
    },
  ]);
  // 告警频率
  const alarmFrequencyEnum = computed(() => allEnum.value?.ALARM_FREQUENCY || [
    {
      value: 'ONCE',
      name: '只告警一次',
      paramMap: null,
    },
    {
      value: 'ONE',
      name: '1分钟/次',
      paramMap: null,
    },
    {
      value: 'FIVE',
      name: '5分钟/次',
      paramMap: null,
    },
    {
      value: 'TEN',
      name: '10分钟/次',
      paramMap: null,
    },
    {
      value: 'FIFTEEN',
      name: '15分钟/次',
      paramMap: null,
    },
    {
      value: 'THIRTY',
      name: '30分钟/次',
      paramMap: null,
    },
    {
      value: 'SIXTY',
      name: '1小时/次',
      paramMap: null,
    },
  ]);
  // 告警等级
  const alarmLevelEnum = computed(() => allEnum.value?.ALARM_LEVEL || [
    {
      value: 'ONE',
      name: '一级',
      paramMap: {
        color: '#D43030',
        icon: 'icon1',
      },
    },
    {
      value: 'TWO',
      name: '二级',
      paramMap: {
        color: '#FF8D1A',
        icon: 'icon2',
      },
    },
    {
      value: 'THREE',
      name: '三级',
      paramMap: {
        color: '#6738BD',
        icon: 'icon3',
      },
    },
    {
      value: 'FOUR',
      name: '四级',
      paramMap: {
        color: '#009DEA',
        icon: 'icon4',
      },
    },
    {
      value: 'FIVE',
      name: '五级',
      paramMap: {
        color: '#28D5CB',
        icon: 'icon5',
      },
    },
  ]);

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
