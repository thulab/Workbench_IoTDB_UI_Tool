import { getStartAndEnd, getOneDay, getOneInterval, todayNow, getOneIntervalNow } from '@/utils/date';

// const { t } = i18n.global;

export default function useShortcutsDate() {
  const { t } = useI18n();

  const shortcutsDate = ref([
    {
      text: t('common.today'),
      value: () => todayNow(),
    },
    {
      text: t('common.yesterday'),
      value: () => getOneDay(1),
    },
    {
      text: t('common.7dayAgo'),
      value: () => getOneDay(7),
    },
  ]);
  const shortcutsDaterange = ref([
    {
      text: t('common.today'),
      value: () => getStartAndEnd(0),
    },
    {
      text: t('common.yesterday'),
      value: () => getOneInterval(1),
    },
    {
      text: t('common.7dayRecend'),
      value: () => getOneIntervalNow(7),
    },
  ]);

  useLangSwitched(() => {
    shortcutsDate.value = [
      {
        text: t('common.today'),
        value: () => todayNow(),
      },
      {
        text: t('common.yesterday'),
        value: () => getOneDay(1),
      },
      {
        text: t('common.7dayAgo'),
        value: () => getOneDay(7),
      },
    ];
    shortcutsDaterange.value = [
      {
        text: t('common.today'),
        value: () => getStartAndEnd(0),
      },
      {
        text: t('common.yesterday'),
        value: () => getOneInterval(1),
      },
      {
        text: t('common.7dayRecend'),
        value: () => getOneIntervalNow(7),
      },
    ];
  });
  return {
    shortcutsDaterange,
    shortcutsDate,
  };
}
