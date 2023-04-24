import { reactive } from 'vue';

export function useDataTypeIcon() {
  const iconArr = reactive({
    icon: {
      INT64: 'int64',
      BOOLEAN: 'buer',
      INT32: 'int32',
      TEXT: 'TEXT',
      DOUBLE: 'DOUBLE',
      FLOAT: 'FLOAT',
      TIME: 'time',
    },
  });
  const getIconName = (icon?: IotdbDataType | 'TIME') => {
    if (!icon) return '';
    return iconArr.icon[icon];
  };
  return {
    getIconName,
  };
}
export default useDataTypeIcon;
