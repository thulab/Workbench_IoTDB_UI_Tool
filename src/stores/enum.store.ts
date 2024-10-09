import { defineStore } from 'pinia';
import { AlarmApi } from '@/api';
import i18n from '@/locale/index';

const { t } = i18n.global;

const { requestFn: getConfigEnum } = useRequest(AlarmApi.getConfigEnum);

export const useEnumStore = defineStore(
  'EnumStore',
  () => {
    const allEnum = ref<Record<string, ConfigEnumData[]>>({});
    // 布尔类型告警规则
    const alarmBooleanRuleEnum = computed(
      () =>
        allEnum.value?.ALARM_BOOLEAN_RULE || [
          {
            value: 'change0',
            name: t('alarmEnum.change0'),
            paramMap: null,
          },
          {
            value: 'change1',
            name: t('alarmEnum.change1'),
            paramMap: null,
          },
          {
            value: 'change',
            name: t('alarmEnum.change'),
            paramMap: null,
          },
        ]
    );
    // 数值类型告警规则
    const alarmNumberRuleEnum = computed(
      () =>
        allEnum.value?.ALARM_NUMERICAL_RULE || [
          {
            value: 'GREATER_THAN',
            name: t('alarmEnum.gt'),
            paramMap: null,
          },
          {
            value: 'LESS_THAN',
            name: t('alarmEnum.lt'),
            paramMap: null,
          },
          {
            value: 'GREATER_THAN_OR_EQUAL',
            name: t('alarmEnum.gtq'),
            paramMap: null,
          },
          {
            value: 'LESS_THAN_OR_EQUAL',
            name: t('alarmEnum.ltq'),
            paramMap: null,
          },
          {
            value: 'EQUAL',
            name: t('alarmEnum.eq'),
            paramMap: null,
          },
          {
            value: 'NOT_EQUAL',
            name: t('alarmEnum.uq'),
            paramMap: null,
          },
        ]
    );
    // 告警频率
    const alarmFrequencyEnum = computed(
      () =>
        allEnum.value?.ALARM_FREQUENCY || [
          {
            value: 'ONCE',
            name: t('alarmEnum.once'),
            paramMap: null,
          },
          {
            value: 'ONE',
            name: t('alarmEnum.one'),
            paramMap: null,
          },
          {
            value: 'FIVE',
            name: t('alarmEnum.five'),
            paramMap: null,
          },
          {
            value: 'TEN',
            name: t('alarmEnum.ten'),
            paramMap: null,
          },
          {
            value: 'FIFTEEN',
            name: t('alarmEnum.fifteen'),
            paramMap: null,
          },
          {
            value: 'THIRTY',
            name: t('alarmEnum.thirty'),
            paramMap: null,
          },
          {
            value: 'SIXTY',
            name: t('alarmEnum.sixty'),
            paramMap: null,
          },
        ]
    );
    // 告警等级
    const alarmLevelEnum = computed(
      () =>
        allEnum.value?.ALARM_LEVEL || [
          {
            value: 'ONE',
            name: t('alarmEnum.level1'),
            paramMap: {
              color: '#D43030',
              icon: 'icon1',
            },
          },
          {
            value: 'TWO',
            name: t('alarmEnum.level2'),
            paramMap: {
              color: '#FF8D1A',
              icon: 'icon2',
            },
          },
          {
            value: 'THREE',
            name: t('alarmEnum.level3'),
            paramMap: {
              color: '#6738BD',
              icon: 'icon3',
            },
          },
          {
            value: 'FOUR',
            name: t('alarmEnum.level4'),
            paramMap: {
              color: '#009DEA',
              icon: 'icon4',
            },
          },
          {
            value: 'FIVE',
            name: t('alarmEnum.level5'),
            paramMap: {
              color: '#28D5CB',
              icon: 'icon5',
            },
          },
        ]
    );

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
  },
  {
    persist: {
      storage: sessionStorage,
      afterHydrate: (context) => {
        if (!context.store.allEnum || Object.keys(context.store.allEnum).length === 0) {
          context.store.loadAllEnum();
        }
      },
    },
  }
);

export default useEnumStore;
