import { ref } from 'vue';

export default function useWebsocket(url: string, receiveData: Function) {
  const socketInstance = ref<WebSocket | null>();

  /**
   * readyState
   * 0 正在连接
   * 1 连接成功
   * 2 连接正在关闭
   * 3 连接已经关闭/打开连接失败
   */

  function initWebsocket() {
    if (!('WebSocket' in window)) {
      ElMessage.warning('您的浏览器不支持webSocket,请使用更高版本浏览器！');
    } else {
      // 实例化socket
      socketInstance.value = new WebSocket(`ws://${window.location.host}${url}`);
      // 监听socket连接
      socketInstance.value.onopen = function () {
        console.log('WebSocket opened.');
      };
      // 监听socket错误信息
      socketInstance.value.onerror = function (event) {
        console.log('WebSocket error:', event);
      };
      // 监听socket消息
      socketInstance.value.onmessage = function (event) {
        receiveData(event.data);
      };
      // 断开
      socketInstance.value.onclose = function () {
        console.log('websocket断开');
      };
    }
  }

  initWebsocket();

  return {
    socketInstance,
    initWebsocket,
  };
}
