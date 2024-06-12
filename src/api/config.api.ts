import http from '@/utils/http';

// 数据库配置
class ConfigApi {
  static updateConfigs(base: string, contents: string, nodeId?: string): HttpResponseP {
    return http.post('/config/updateConfigs', { base, contents, nodeId });
  }

  static getConfigFile(nodeId: string): HttpResponseP<string> {
    return http.get('/config/getConfigFile', { params: { nodeId } });
  }

  static getConfigTemplate(): HttpResponseP<string> {
    return http.get('/config/getConfigTemplate');
  }
}
export default ConfigApi;
