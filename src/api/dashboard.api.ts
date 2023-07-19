import http from '@/utils/http';

// 首页
class DashboardApi {
  // 获取系统信息
  static getSystemInfo(): HttpResponseP<Dashboard.SystemInfoRes> {
    return http.get('/home/getSystemInfo');
  }

  // 内存
  static getMetricMemory(): HttpResponseP {
    return http.get('/home/getMetricMemory');
  }

  // 获取每秒写入点数信息
  static getMetricInsertNumPerSecond(): HttpResponseP<number> {
    return http.get('/home/getMetricInsertNumPerSecond');
  }

  // 文件数
  static getMetricFileCount(): HttpResponseP<number> {
    return http.get('/home/getMetricFileCount');
  }

  // disk
  static getMetricDisk(): HttpResponseP {
    return http.get('/home/getMetricDisk');
  }

  // 获取磁盘I/O繁忙速率信息
  static getMetricDiskIOUsedRate(): HttpResponseP<Dashboard.DiskIOUsedRateRes[]> {
    return http.get('/home/getMetricDiskIOUsedRate');
  }

  // CPU
  static getMetricCPU(): HttpResponseP<Dashboard.MetricCPURes> {
    return http.get('/home/getMetricCPU');
  }

  // CPU负载
  static getMetricCPULoad(): HttpResponseP<Dashboard.MetricCPULoadRes> {
    return http.get('/home/getMetricCPULoad');
  }
}
export default DashboardApi;
