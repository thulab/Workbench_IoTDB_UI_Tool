/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */

import { ref, type Ref } from 'vue';

// 1001
// 1330 无权限
const alertErrorCode = [1001];

interface Opt<T> {
  initData?: T;
  message?: string; // 成功默认提示
  errMessage?: boolean | string; // 失败默认toast提示
}

const showError = (message: string, code?: number) => {
  if (!message) return;
  // 有code 并且在toastErrorCode中 或者 code不包含-的
  if (code && alertErrorCode.includes(code) && !window.__errBoxShowing__) {
    window.__errBoxShowing__ = true;
    ElMessageBox.confirm(message, '错误', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      confirmButtonClass: `request-error-confirm-${message}`,
      cancelButtonClass: `request-error-cancel-${message}`,
      type: 'error',
    }).then(() => {
      if (code && code === 1008) {
        localStorage.setItem('authorization', '');
        window.location.reload();
      }
    }).finally(() => {
      window.__errBoxShowing__ = false;
    });
  } else if (code && !alertErrorCode.includes(code) && code !== 1320 && code !== 9999) {
    ElMessage.error({
      message,
      grouping: true,
      dangerouslyUseHTMLString: code === 2000,
      duration: code === 2000 ? 4000 : 3000,
    });
  }
};

export const showErrorFn = (err: HttpError, defaultErrMessage?: string | boolean) => {
  if ((err.status && err.status !== 200 && (err.status !== 401 || err.status !== 403))) {
    ElMessage.error({ message: '内部服务异常，请联系管理员', grouping: true });
  } else if (typeof defaultErrMessage === 'string') {
    showError(defaultErrMessage, err.code);
  } else if (defaultErrMessage && err.message) {
    showError(err.message, err.code);
  } else if (err.error) {
    showError(err.error, err.code);
  } else if (!err) {
    ElMessage.error({ message: '内部服务异常，请联系管理员', grouping: true });
  }
};

export default function useRequest<Requests extends Array<any>, Resp>(apiFn: (...args: Requests) => HttpResponseP<Resp>, opt?: Opt<Resp>) {
  const options = {
    errMessage: true,
    ...opt,
  };
  const loading = ref(false);
  const data = ref(options.initData as Resp) as Ref<Resp>;
  const error = ref(null) as Ref<any>;

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
        if (err.type === 'application/json') {
          return err.text().then((str: string) => {
            const formatErr = JSON.parse(str);
            showErrorFn(formatErr, '文件下载失败');
            return Promise.reject(data);
          });
        }
        if (err.status !== 401 || err.status !== 403) {
          showErrorFn(err, options.errMessage);
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
    showErrorFn,
  };
}
