import http from '@/utils/http';

export default class AIAnalysisApi {
  static getModels(keyword: string): HttpResponseP<AIAnalysis.Model[]> {
    return http.get('/ai-analysis/getModels', { params: { keyword } });
  }

  static checkModelName(modelId: string): HttpResponseP {
    return http.post('/ai-analysis/checkModelId', { modelId });
  }

  static batchDeleteModel(modelIds: string[]): HttpResponseP {
    return http.post('/ai-analysis/batchDeleteModel', { modelIds });
  }

  static importModel(ptFile: File, yamlFile: File, modelId: string): HttpResponseP {
    const formData = new FormData();
    formData.append('ptFile', ptFile);
    formData.append('yamlFile', yamlFile);
    formData.append('modelId', modelId);
    return http.post('/ai-analysis/importModel', formData);
  }

  static search(data: AIAnalysis.SearchCondition): HttpResponseP<AIAnalysis.SearchDataResult> {
    return http.post('/ai-analysis/search', data);
  }

  static getCustomData(sql: string): HttpResponseP<{ outputs: AIAnalysis.CustomItem[] }> {
    return http.post('/ai-analysis/customize', { sql });
  }

  static writeBack(data: { raw: AIAnalysis.SearchDataItem[]; analysis: AIAnalysis.SearchDataItem[]; modelType: string; measurement: string; dataType: string }): HttpResponseP {
    return http.post('/ai-analysis/writeBack', data);
  }

  static getExportId(data: { modelType: string; measurement: string; dataType: string; raw: AIAnalysis.SearchDataItem[]; analysis: AIAnalysis.SearchDataItem[] }): HttpResponseP<String> {
    return http.post('/file/analysisExportId', data);
  }

  static getCustomExportId(data: { outputs: AIAnalysis.CustomItem[] }): HttpResponseP<string> {
    return http.post('/file/analysisCustomizeExportId', data);
  }

  static fineTune(data: AIAnalysis.FineTuningData): HttpResponseP<string> {
    return http.post('/ai-analysis/tuned', data);
  }
}
