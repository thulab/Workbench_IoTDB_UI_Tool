/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */

import { ref, type Ref } from 'vue';

const toastErrorCode = ['CONN-0002', 'CONN-0003', 'USER-0004', 'USER-0012', 'USER-0006', 'CSV-0002', 'IOTDB-0001', 'IOTDB-0002', 'IOTDB-0013', 'IOTDB-0016', 'IOTDB-0022', 'IOTDB-0023', 'IOTDB-0024', 'IOTDB-0025', 'IOTDB-0026', 'IOTDB-0027', 'IOTDB-0054', 'IOTDB-0055', 'IOTDB-0056', 'IOTDB-0066', 'IOTDB-0067', 'IOTDB-0069', 'IOTDB-0070', 'IOTDB-0072', 'IOTDB-0098', 'GROUP-0001', 'GROUP-0002', 'DEV-0001', 'DEV-0002', 'MEASU-0004', 'MEASU-0002', 'MEASU-0003', 'ROLE-0001', 'ROLE-0002', 'MEASU-0004'];

interface Opt<T> {
  initData?: T;
  message?: string; // 成功默认提示
  errMessage?: boolean | string; // 失败默认toast提示
}

export default function useRequest<Requests extends Array<any>, Resp>(apiFn: (...args: Requests) => HttpResponseP<Resp>, opt?: Opt<Resp>) {
  const options = {
    errMessage: true,
    ...opt,
  };
  const loading = ref(false);
  const data = ref(options.initData as Resp) as Ref<Resp>;
  const error = ref(null) as Ref<any>;

  const showError = (message: string, code?: string) => {
    if (!message) return;
    // 有code 并且在toastErrorCode中 或者 code不包含-的
    if (code && (toastErrorCode.includes(code) || !code.includes('-'))) {
      ElMessage.error({ message, grouping: true });
    } else if (!window.__errBoxShowing__) {
      window.__errBoxShowing__ = true;
      ElMessageBox.alert(message, '提示', {
        confirmButtonText: '确定',
        type: 'error',
      }).then(() => {
        window.__errBoxShowing__ = false;
        if (code && code === 'USER-0008') {
          localStorage.setItem('authorization', '');
          window.location.reload();
        }
      });
    }
  };

  function requestFn(...args: Requests): Promise<ApiResponse<Resp>> {
    loading.value = true;
    return apiFn(...args)
      .then((response) => {
        data.value = response.data.data;
        if (typeof options.message === 'string' && options.message) {
          ElMessage.success(options.message);
        }
        if (response.headers.authorization) {
          localStorage.setItem('authorization', response.headers.authorization);
        }
        return response.data;
      })
      .catch((err: HttpError) => {
        error.value = err;
        if (err.status && err.status !== 200) {
          ElMessage.error({ message: '内部服务异常，请联系管理员', grouping: true });
        } else if (typeof options.errMessage === 'string') {
          showError(options.errMessage, err.code);
        } else if (options.errMessage && err.message) {
          showError(err.message, err.code);
        } else if (err.error) {
          showError(err.error, err.code);
        }
        return Promise.reject(err);
      })
      .finally(() => {
        loading.value = false;
      });
  }

  return {
    loading,
    data,
    error,
    requestFn,
  };
}
