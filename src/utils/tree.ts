/**
 * 将二维数组转换为树形结构
 * @param valueList 二维数组，每一行代表一个层级路径
 * @returns 树形结构数据
 */
export function convertArrayToTree(valueList: string[][]): Array<{ label: string; value: string; children?: Array<{ label: string; value: string; children?: any }> }> {
  const treeMap = new Map();

  valueList.forEach((row) => {
    if (row.length === 0) return;

    let currentLevel = treeMap;

    row.forEach((item, index) => {
      if (!currentLevel.has(item)) {
        currentLevel.set(item, {
          label: item,
          value: item,
          children: new Map(),
        });
      }

      // 如果不是最后一级，继续构建下一级
      if (index < row.length - 1) {
        currentLevel = currentLevel.get(item).children;
      }
    });
  });

  // 将 Map 转换为数组格式
  function mapToArray(map: Map<string, any>): any[] {
    return Array.from(map.values()).map((item) => ({
      label: item.label,
      value: item.value,
      ...(item.children.size > 0 && { children: mapToArray(item.children) }),
    }));
  }

  return mapToArray(treeMap);
}

/**
 * 将设备数据转换为级联选择器的选项格式
 * @param deviceData 设备数据的二维数组
 * @returns 级联选择器选项
 */
export function convertDeviceDataToOptions(deviceData: string[][]): Array<{ label: string; value: string; children?: any[] }> {
  return convertArrayToTree(deviceData);
}

/**
 * 将设备标签转换为键值对格式
 * @param device 设备标签字符串或数组
 * @param columns 可选的列名数组，用于生成标签名称
 * @returns "columns1"='device1', "columns2"='device2' 的 字符串数组
 */
export function convertTags(device?: string[], columns?: string[]): string[] | undefined {
  if (!device || !Array.isArray(device) || device.length === 0 || !columns || columns.length === 0) {
    return undefined;
  }

  if (device.length === 1) {
    return [` "${columns[0]}"='${device[0]}' `];
  }

  return device.map((item, index) => {
    const columnName = columns[index];
    return ` "${columnName}"='${item}' `;
  });
}
