import http from '@/utils/http';

// 首页
class DashboardApi {
  // 获取系统信息
  static getSystemInfo(orderBy: string[], asc: string[]): HttpResponseP<Dashboard.SystemInfoRes> {
    return http.post('/home/getSystemInfo', { orderBy, asc });
  }

  // 内存
  static getMetricMemory(nodeID: string, nodeType: string, isMaster: boolean): HttpResponseP<Dashboard.MetricMemoryRes> {
    return http.get('/home/getMetricMemory', { params: { nodeID, nodeType, isMaster } });
  }

  // 内存-all
  static getMetricAllMemory(isMaster: boolean): HttpResponseP<Dashboard.MetricMemoryRes[]> {
    return http.get('/home/getAllMetricMemory', { params: { isMaster } });
  }

  // 获取每秒写入点数信息
  static getMetricInsertNumPerSecond(isMaster: boolean): HttpResponseP<number> {
    return http.get('/home/getMetricInsertNumPerSecond', { params: { isMaster } });
  }

  // 文件数
  static getMetricFileCount(nodeID: string, nodeType: string, isMaster: boolean): HttpResponseP<number> {
    return http.get('/home/getMetricFileCount', { params: { nodeID, nodeType, isMaster } });
  }

  // 文件数-all
  static getMetricAllFileCount(isMaster: boolean): HttpResponseP<number> {
    return http.get('/home/getMetricAllFileCount', { params: { isMaster } });
  }

  // disk
  static getMetricDisk(nodeID: string, isMaster: boolean): HttpResponseP<Dashboard.MetricDiskRes> {
    return http.get('/home/getMetricDisk', { params: { nodeID, isMaster } });
  }

  // disk-all
  static getMetricAllDisk(isMaster: boolean): HttpResponseP<Dashboard.MetricDiskRes> {
    return http.get('/home/getMetricAllDisk', { params: { isMaster } });
  }

  // 获取磁盘I/O繁忙速率信息
  static getMetricDiskIOUsedRate(nodeID: string, isMaster: boolean): HttpResponseP<Dashboard.DiskIOUsedRateRes[]> {
    return http.get('/home/getMetricDiskIOUsedRate', { params: { nodeID, isMaster } });
  }

  // CPU
  static getMetricCPU(nodeID: string, nodeType: string, isMaster: boolean): HttpResponseP<Dashboard.MetricCPURes> {
    return http.get('/home/getMetricCPU', { params: { nodeID, nodeType, isMaster } });
  }

  // CPU-all
  static getMetricAllCPU(isMaster: boolean): HttpResponseP<Dashboard.MetricCPURes[]> {
    return http.get('/home/getMetricAllCPU', { params: { isMaster } });
  }

  // CPU负载
  static getMetricCPULoad(nodeID: string, nodeType: string, isMaster: boolean): HttpResponseP<Dashboard.MetricCPULoadRes> {
    return http.get('/home/getMetricCPULoad', { params: { nodeID, nodeType, isMaster } });
  }

  static getActiveInfo(isMaster: boolean): HttpResponseP<Dashboard.ActiveData> {
    return http.get('/home/getActivationInfo', { params: { isMaster } });
  }
}
export default DashboardApi;
