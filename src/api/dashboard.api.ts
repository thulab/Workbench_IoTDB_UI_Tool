import http from '@/utils/http';

// 首页
class DashboardApi {
  // 获取系统信息
  static getSystemInfo(orderBy: string, asc: string): HttpResponseP<Dashboard.SystemInfoRes> {
    return http.get('/home/getSystemInfo', { params: { orderBy, asc } });
  }

  // 内存
  static getMetricMemory(nodeID: string, nodeType: string): HttpResponseP<Dashboard.MetricMemoryRes> {
    return http.get('/home/getMetricMemory', { params: { nodeID, nodeType } });
  }

  // 内存-all
  static getMetricAllMemory(): HttpResponseP<Dashboard.MetricMemoryRes[]> {
    return http.get('/home/getAllMetricMemory');
  }

  // 获取每秒写入点数信息
  static getMetricInsertNumPerSecond(): HttpResponseP<number> {
    return http.get('/home/getMetricInsertNumPerSecond');
  }

  // 文件数
  static getMetricFileCount(nodeID: string, nodeType: string): HttpResponseP<number> {
    return http.get('/home/getMetricFileCount', { params: { nodeID, nodeType } });
  }

  // 文件数-all
  static getMetricAllFileCount(): HttpResponseP<number> {
    return http.get('/home/getMetricAllFileCount');
  }

  // disk
  static getMetricDisk(nodeID: string, nodeType: string): HttpResponseP<Dashboard.MetricDiskRes> {
    return http.get('/home/getMetricDisk', { params: { nodeID, nodeType } });
  }

  // disk-all
  static getMetricAllDisk(): HttpResponseP<Dashboard.MetricDiskRes[]> {
    return http.get('/home/getMetricAllDisk');
  }

  // 获取磁盘I/O繁忙速率信息
  static getMetricDiskIOUsedRate(nodeID: string): HttpResponseP<Dashboard.DiskIOUsedRateRes[]> {
    return http.get('/home/getMetricDiskIOUsedRate', { params: { nodeID } });
  }

  // CPU
  static getMetricCPU(nodeID: string, nodeType: string): HttpResponseP<Dashboard.MetricCPURes> {
    return http.get('/home/getMetricCPU', { params: { nodeID, nodeType } });
  }

  // CPU-all
  static getMetricAllCPU(): HttpResponseP<Dashboard.MetricCPURes[]> {
    return http.get('/home/getMetricAllCPU');
  }

  // CPU负载
  static getMetricCPULoad(nodeID: string, nodeType: string): HttpResponseP<Dashboard.MetricCPULoadRes> {
    return http.get('/home/getMetricCPULoad', { params: { nodeID, nodeType } });
  }
}
export default DashboardApi;
