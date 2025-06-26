import http from '@/utils/http';
import { encodeAES } from '@/utils/secret';
import { cloneDeep } from 'lodash-es';

// 连接
class ConnectionApi {
  // 获取连接实例列表
  static getConnectionList(): HttpResponseP<Connection.ConnectionItem[]> {
    return http.get('/connection/getConnectionList');
  }

  // 获取连接实例详情
  static getConnectionDetail(id: number): HttpResponseP<Connection.ConnectionDetail> {
    return http.get('/connection/getConnectionById', { params: { id } });
  }

  // 删除连接实例
  static deleteConnection(id: number): HttpResponseP {
    return http.get('/connection/deleteConnectionById', { params: { id } });
  }

  // 保存更新连接实例
  static saveConnection(payload: Connection.ConnectionDetail): HttpResponseP<number> {
    const data = cloneDeep(payload);
    if (data.masterCluster && data.masterCluster.prometheusPassword) {
      data.masterCluster.prometheusPassword = encodeAES(data.masterCluster.prometheusPassword);
    }
    if (data.slaveCluster && data.slaveCluster.prometheusPassword) {
      data.slaveCluster.prometheusPassword = encodeAES(data.slaveCluster.prometheusPassword);
    }
    return http.post('/connection/saveOrUpdateConnection', { ...data, password: '' });
  }

  // 保存Prometheus
  static savePrometheus(data: Connection.SavePrometheusDetail): HttpResponseP {
    if (data.prometheusPasswordMaster) {
      data.prometheusPasswordMaster = encodeAES(data.prometheusPasswordMaster);
    }
    if (data.prometheusPasswordSlave) {
      data.prometheusPasswordSlave = encodeAES(data.prometheusPasswordSlave);
    }
    return http.post('/connection/updatePrometheus', data);
  }

  // 测试连接实例
  static testConnection(payload: Connection.ConnectionDetail): HttpResponseP {
    const data = cloneDeep(payload);
    data.password = encodeAES(data.password);
    if (data.masterCluster && data.masterCluster.prometheusPassword) {
      data.masterCluster.prometheusPassword = encodeAES(data.masterCluster.prometheusPassword);
    }
    if (data.slaveCluster && data.slaveCluster.prometheusPassword) {
      data.slaveCluster.prometheusPassword = encodeAES(data.slaveCluster.prometheusPassword);
    }
    return http.post('/connection/testConnection', data);
  }

  // 测试Prometheus
  static testPrometheus(payload: Connection.PrometheusDetail): HttpResponseP {
    const data = cloneDeep(payload);
    if (data.prometheusPasswordMaster) {
      data.prometheusPasswordMaster = encodeAES(data.prometheusPasswordMaster);
    }
    if (data.prometheusPasswordSlave) {
      data.prometheusPasswordSlave = encodeAES(data.prometheusPasswordSlave);
    }
    return http.post('/connection/testPrometheus', data);
  }

  // 登录保存连接实例
  static loginByConnection(payload: Connection.ConnectionDetail): HttpResponseP<number> {
    const data = cloneDeep(payload);
    data.password = encodeAES(data.password);
    if (data.masterCluster && data.masterCluster.prometheusPassword) {
      data.masterCluster.prometheusPassword = encodeAES(data.masterCluster.prometheusPassword);
    }
    if (data.slaveCluster && data.slaveCluster.prometheusPassword) {
      data.slaveCluster.prometheusPassword = encodeAES(data.slaveCluster.prometheusPassword);
    }
    return http.post('/loginAndSave', data);
  }

  // 更改主备集群
  static changeCluster(type: number): HttpResponseP {
    return http.get('/changeCluster', { params: { type } });
  }

  // 存储关系图
  static saveRelationalGraph(data: string): HttpResponseP {
    return http.post('/relationalGraph/save', { detail: data });
  }

  // 获取关系图
  static getRelationalGraph(): HttpResponseP<{ detail: string }> {
    return http.get('/relationalGraph/get');
  }

  static switchModel(model: 'tree' | 'table'): HttpResponseP {
    return http.get('/changeModel', { params: { model } });
  }
}
export default ConnectionApi;
