import { ref } from 'vue';
import i18n from '@/locale/index';

const { t } = i18n.global;

export default function useWebsocket(url: string, receiveData: Function, isInit: boolean = true) {
  const socketInstance = ref<WebSocket | null>();

  /**
   * readyState
   * 0 正在连接
   * 1 连接成功
   * 2 连接正在关闭
   * 3 连接已经关闭/打开连接失败
   */

  function initWebsocket(handleOpen?: Function) {
    if (!('WebSocket' in window)) {
      ElMessage.warning({ message: t('common.websockerVersionTip'), grouping: true });
    } else {
      if (socketInstance.value) {
        socketInstance.value.close();
      }
      // 实例化socket
      socketInstance.value = new WebSocket(`${window.location.protocol === 'http:' ? 'ws:' : 'wss:'}//${window.location.host}${url}`);
      // 监听socket连接
      socketInstance.value.onopen = () => {
        console.log('WebSocket opened.');
        if (handleOpen) handleOpen();
      };
      // 监听socket错误信息
      socketInstance.value.onerror = (event) => {
        console.log('WebSocket error:', event);
      };
      // 监听socket消息
      socketInstance.value.onmessage = (event) => {
        receiveData(event.data);
      };
      // 断开
      socketInstance.value.onclose = () => {
        console.log('websocket断开');
      };
    }
  }

  if (isInit) {
    initWebsocket();
  }

  return {
    socketInstance,
    initWebsocket,
  };
}
