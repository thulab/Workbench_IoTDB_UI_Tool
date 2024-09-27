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
}
