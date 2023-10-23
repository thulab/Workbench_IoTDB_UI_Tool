import http from '@/utils/http';

// 数据同步
class DataSyncApi {
  static getDataSynchronList(taskName: string): HttpResponseP<DataSync.SynchronListData[]> {
    return http.get('/synchron/getDataSynchronList', { params: { taskName } });
  }

  static startTaskByNames(taskName: string[]): HttpResponseP {
    return http.post('/synchron/startTaskByNames', { taskName });
  }

  static stopTaskByNames(taskName: string[]): HttpResponseP {
    return http.post('/synchron/stopTaskByNames', { taskName });
  }

  static deleteDataSynchronByNames(taskNames: string[]): HttpResponseP {
    return http.post('/synchron/deleteDataSynchronByNames', { taskNames });
  }

  static saveSynchronTask(data: DataSync.SynchronData): HttpResponseP {
    return http.post('/synchron/saveSynchronTask', data);
  }

  static saveAdvancedTask(advancedTask: string): HttpResponseP {
    return http.post('/synchron/saveAdvancedTask', { advancedTask });
  }

  static getTaskDetail(taskName: string): HttpResponseP<DataSync.SynchronData> {
    return http.get('/synchron/getTaskDetail', { params: { taskName } });
  }

  static getAdvancedTaskDetail(taskName: string): HttpResponseP<{ name: string, advancedInput: string }> {
    return http.get('/synchron/getAdvancedTaskDetail', { params: { taskName } });
  }

  static getPilePluginsList(): HttpResponseP<DataSync.PluginList> {
    return http.get('/synchron/getPilePluginsList');
  }
}
export default DataSyncApi;
