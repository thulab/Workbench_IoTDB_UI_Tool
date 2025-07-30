import { ref, type Ref } from 'vue';

import i18n from '@/locale/index';

const { t } = i18n.global;

// 1001
// 1330 无权限
// 2000 实例连接 IoTDB Prometheus 报错信息换行
// 1320 审计日志 不弹异常
// 9999 1380 新建测点 异常
const alertErrorCode = [1001];
const unTipCodes = [1320, 1380, 9999];

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
    ElMessageBox.confirm(message, t('common.error'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      confirmButtonClass: `request-error-confirm-${message}`,
      cancelButtonClass: `request-error-cancel-${message}`,
      type: 'error',
    })
      .then(() => {
        if (code && code === 1008) {
          localStorage.setItem('authorization', '');
          window.location.reload();
        }
      })
      .finally(() => {
        window.__errBoxShowing__ = false;
      });
  } else if (code && !alertErrorCode.includes(code) && !unTipCodes.includes(code)) {
    ElMessage.error({
      message,
      grouping: true,
      dangerouslyUseHTMLString: code === 2000,
      duration: code === 2000 ? 4000 : 3000,
    });
  }
};

export const showErrorFn = (err: HttpError, defaultErrMessage?: string | boolean) => {
  if (err.status && err.status !== 200 && (err.status !== 401 || err.status !== 403)) {
    ElMessage.error({ message: t('login.serverError'), grouping: true });
  } else if (typeof defaultErrMessage === 'string') {
    showError(defaultErrMessage, err.code);
  } else if (defaultErrMessage && err.message) {
    showError(err.message, err.code);
  } else if (err.error) {
    showError(err.error, err.code);
  } else if (!err) {
    ElMessage.error({ message: t('login.serverError'), grouping: true });
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
            showErrorFn(formatErr, t('common.fileDownError'));
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
