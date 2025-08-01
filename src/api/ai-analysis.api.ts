import http from '@/utils/http';
import type { Model, SearchDataResult, CustomItem, SearchCondition, SearchDataItem, FineTuningData } from '@/types/ai-analysis';
export default class AIAnalysisApi {
  static getModels(keyword: string): globalThis.HttpResponseP<Model[]> {
    return http.get('/ai-analysis/getModels', { params: { keyword } });
  }

  static checkModelName(modelId: string): globalThis.HttpResponseP {
    return http.post('/ai-analysis/checkModelId', { modelId });
  }

  static batchDeleteModel(modelIds: string[]): globalThis.HttpResponseP {
    return http.post('/ai-analysis/batchDeleteModel', { modelIds });
  }

  static importModel(ptFile: File, yamlFile: File, modelId: string): globalThis.HttpResponseP {
    const formData = new FormData();
    formData.append('ptFile', ptFile);
    formData.append('yamlFile', yamlFile);
    formData.append('modelId', modelId);
    return http.post('/ai-analysis/importModel', formData);
  }

  static search(data: SearchCondition): globalThis.HttpResponseP<SearchDataResult> {
    return http.post('/ai-analysis/search', data);
  }

  static getCustomData(sql: string): globalThis.HttpResponseP<{ outputs: CustomItem[] }> {
    return http.post('/ai-analysis/customize', { sql });
  }

  static writeBack(data: { raw: SearchDataItem[]; analysis: SearchDataItem[]; modelType: string; measurement: string; dataType: string }): globalThis.HttpResponseP {
    return http.post('/ai-analysis/writeBack', data);
  }

  static getExportId(data: { modelType: string; measurement: string; dataType: string; raw: SearchDataItem[]; analysis: SearchDataItem[] }): globalThis.HttpResponseP<string> {
    return http.post('/file/analysisExportId', data);
  }

  static getCustomExportId(data: { outputs: CustomItem[] }): globalThis.HttpResponseP<string> {
    return http.post('/file/analysisCustomizeExportId', data);
  }

  static fineTune(data: FineTuningData): globalThis.HttpResponseP<string> {
    return http.post('/ai-analysis/tuned', data);
  }
}
