import type { Model } from '@/types';

/**
 * 标准化 AI 模型的 category 字段
 * @param category 原始 category 值
 * @returns 标准化后的 category 值
 */
export function standardizeCategory(category: string): string {
  const upperCategory = category.toUpperCase();

  if (upperCategory === 'BUILTIN' || upperCategory === 'BUILT-IN') {
    return 'BUILT-IN';
  } else if (upperCategory === 'CUSTOM' || upperCategory === 'USER-DEFINED') {
    return 'USER-DEFINED';
  }

  return upperCategory;
}

/**
 * 标准化 AI 模型数据
 * @param model 原始模型数据
 * @returns 标准化后的模型数据
 */
export function standardizeModel(model: Model): Model {
  const state = model.state;
  const category = model.category;

  const standardizedState = state.toUpperCase();
  const standardizedCategory = standardizeCategory(category);

  return {
    ...model,
    state: standardizedState,
    category: standardizedCategory,
    stateString: model.stateString || standardizedState,
    categoryString: model.categoryString || standardizedCategory,
  };
}
